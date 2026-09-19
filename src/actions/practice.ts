"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { getServerSession } from "@/lib/auth/session";
import { findOnboardingProfile } from "@/lib/db/onboarding";
import { ensureModelReady } from "@/lib/db/model-ready";
import { getPracticeSetForStart } from "@/lib/db/practice";
import { evaluatePracticeResponse } from "@/lib/practice/evaluate";
import { buildAttemptAppendUpdate } from "@/lib/practice/submit-update";
import { isPracticeComplete } from "@/lib/practice/score";
import { PracticeExercise } from "@/models/practice/exercise";
import { PracticeSession } from "@/models/practice/session";
import type {
  PracticeExerciseRecord,
  PracticeSessionRecord,
} from "@/models/practice/types";
import type { SubmitPracticeResult } from "@/lib/practice/types";
import {
  practiceResponseSchema,
  startPracticeSchema,
  submitPracticeSchema,
} from "@/validation/practice/answer";

export type StartPracticeResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNAUTHORIZED" | "INVALID" | "NOT_FOUND" | "EMPTY" | "DATABASE";
    };

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

async function requirePracticeUser(): Promise<
  | { userId: string }
  | { error: "DATABASE" }
  | null
> {
  const session = await getServerSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  try {
    const profile = await findOnboardingProfile(userId);
    if (!profile?.completedAt || profile.userId !== userId) return null;
    return { userId };
  } catch (error) {
    console.error("Unable to authorize practice learner.", error);
    return { error: "DATABASE" };
  }
}

export async function startPracticeSession(
  _previous: StartPracticeResult | null,
  formData: FormData,
): Promise<StartPracticeResult> {
  const user = await requirePracticeUser();
  if (!user) return { ok: false, code: "UNAUTHORIZED" };
  if ("error" in user) return { ok: false, code: "DATABASE" };

  const parsed = startPracticeSchema.safeParse({
    practiceSetId: formData.get("practiceSetId"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { ok: false, code: "INVALID" };

  try {
    const practice = await getPracticeSetForStart(parsed.data.practiceSetId);
    if (!practice) return { ok: false, code: "NOT_FOUND" };
    if (!practice.exerciseIds.length) return { ok: false, code: "EMPTY" };

    // Deterministic unique-index build before the first write: concurrent
    // starts on a fresh database must converge via the 11000 path below.
    await ensureModelReady(PracticeSession, "PracticeSession");

    const existing = await PracticeSession.findOne({
      userId: user.userId,
      practiceSetId: practice.set._id,
      status: "active",
    })
      .select({ _id: 1 })
      .lean<{ _id: Types.ObjectId }>()
      .exec();

    if (existing) {
      redirect(`/${parsed.data.locale}/practice/${parsed.data.practiceSetId}`);
    }

    try {
      await PracticeSession.create({
        userId: user.userId,
        practiceSetId: practice.set._id,
        exerciseOrder: practice.exerciseIds,
        currentIndex: 0,
        status: "active",
        attempts: [],
        startedAt: new Date(),
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      // The partial unique index makes concurrent starts converge on one
      // active session. The winning session is the one the learner continues.
    }

    revalidatePath("/[locale]/practice", "layout");
    redirect(`/${parsed.data.locale}/practice/${parsed.data.practiceSetId}`);
  } catch (error) {
    // next/navigation redirect throws a framework-owned control-flow error.
    if (typeof error === "object" && error !== null && "digest" in error) {
      throw error;
    }
    console.error("Unable to start practice session.", error);
    return { ok: false, code: "DATABASE" };
  }
}

function completedAttemptResult(session: PracticeSessionRecord, attempt: PracticeSessionRecord["attempts"][number]): SubmitPracticeResult {
  return {
    ok: true,
    isCorrect: attempt.isCorrect,
    completed: session.status === "completed" || isPracticeComplete(session.attempts.length, session.exerciseOrder.length),
    answeredCount: session.attempts.length,
    totalCount: session.exerciseOrder.length,
  };
}

export async function submitPracticeAnswer(
  _previous: SubmitPracticeResult | null,
  formData: FormData,
): Promise<SubmitPracticeResult> {
  const user = await requirePracticeUser();
  if (!user) return { ok: false, code: "UNAUTHORIZED" };
  if ("error" in user) return { ok: false, code: "DATABASE" };

  const parsed = submitPracticeSchema.safeParse({
    sessionId: formData.get("sessionId"),
    exerciseId: formData.get("exerciseId"),
    response: formData.get("response"),
  });
  if (!parsed.success) return { ok: false, code: "INVALID" };

  let rawResponse: unknown;
  try {
    rawResponse = JSON.parse(parsed.data.response);
  } catch {
    return { ok: false, code: "INVALID" };
  }
  const parsedResponse = practiceResponseSchema.safeParse(rawResponse);
  if (!parsedResponse.success) return { ok: false, code: "INVALID" };

  const sessionId = new Types.ObjectId(parsed.data.sessionId);
  const exerciseId = new Types.ObjectId(parsed.data.exerciseId);

  try {
    const session = await PracticeSession.findOne({
      _id: sessionId,
      userId: user.userId,
      status: "active",
    })
      .lean<PracticeSessionRecord>()
      .exec();
    if (!session) return { ok: false, code: "NOT_ACTIVE" };

    const existingAttempt = session.attempts.find((attempt) => attempt.exerciseId.equals(exerciseId));
    if (existingAttempt) return completedAttemptResult(session, existingAttempt);

    const answeredIds = new Set(session.attempts.map((attempt) => attempt.exerciseId.toString()));
    const nextExerciseId = session.exerciseOrder.find(
      (orderedId) => !answeredIds.has(orderedId.toString()),
    );
    if (!nextExerciseId || !nextExerciseId.equals(exerciseId)) {
      return { ok: false, code: "INVALID" };
    }

    const exercise = await PracticeExercise.findOne({
      _id: exerciseId,
      practiceSetId: session.practiceSetId,
      ...{ status: "published" as const },
    })
      .lean<PracticeExerciseRecord>()
      .exec();
    if (!exercise || exercise.exerciseType !== parsedResponse.data.type) {
      return { ok: false, code: "INVALID" };
    }

    const evaluation = evaluatePracticeResponse(exercise, parsedResponse.data);
    const submittedAt = new Date();
    const attempt = {
      learnerId: user.userId,
      sessionId,
      exerciseId,
      exerciseType: exercise.exerciseType,
      response: evaluation.normalizedResponse,
      isCorrect: evaluation.isCorrect,
      evaluationVersion: 1 as const,
      submittedAt,
    };
    const totalCount = session.exerciseOrder.length;
    const { update } = buildAttemptAppendUpdate({
      previousAttempts: session.attempts,
      attempt,
      totalCount,
      submittedAt,
    });

    // One conditional document update appends the attempt and derives the
    // lifecycle/result from the post-append counts. Plain $push/$set on
    // purpose: Mongoose rejects aggregation-pipeline (array) updates. The
    // `attempts.exerciseId: $ne` guard makes a concurrent duplicate submit
    // match nothing, so the loser falls into the re-read branch below
    // without requiring a MongoDB replica-set transaction.
    const updated = await PracticeSession.findOneAndUpdate(
      {
        _id: sessionId,
        userId: user.userId,
        status: "active",
        "attempts.exerciseId": { $ne: exerciseId },
      },
      update,
      { returnDocument: "after" },
    )
      .lean<PracticeSessionRecord>()
      .exec();

    if (!updated) {
      const concurrent = await PracticeSession.findOne({
        _id: sessionId,
        userId: user.userId,
      })
        .lean<PracticeSessionRecord>()
        .exec();
      const concurrentAttempt = concurrent?.attempts.find((item) => item.exerciseId.equals(exerciseId));
      if (concurrent && concurrentAttempt) return completedAttemptResult(concurrent, concurrentAttempt);
      return { ok: false, code: "ALREADY_SUBMITTED" };
    }

    revalidatePath("/[locale]/practice", "layout");
    return {
      ok: true,
      isCorrect: evaluation.isCorrect,
      completed: updated.status === "completed",
      answeredCount: updated.attempts.length,
      totalCount: updated.exerciseOrder.length,
    };
  } catch (error) {
    console.error("Unable to submit practice answer.", error);
    return { ok: false, code: "DATABASE" };
  }
}
