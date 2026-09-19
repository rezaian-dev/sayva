"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { getServerSession } from "@/lib/auth/session";
import { findOnboardingProfile } from "@/lib/db/onboarding";
import { findPublishedLessonForCompletion } from "@/lib/db/learning";
import { ensureModelReady } from "@/lib/db/model-ready";
import { LessonProgress } from "@/models/learning/progress";
import { lessonIdSchema } from "@/validation/learning/lesson";

export type CompleteLessonResult =
  | { ok: true; lessonId: string }
  | {
      ok: false;
      code: "UNAUTHORIZED" | "INVALID" | "NOT_FOUND" | "DATABASE";
    };

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

/**
 * Authenticate → authorize learner ownership → validate → enforce published
 * lesson business rules → persist an idempotent completion.
 */
export async function completeLesson(
  _previous: CompleteLessonResult | null,
  formData: FormData,
): Promise<CompleteLessonResult> {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  let profile;
  try {
    profile = await findOnboardingProfile(userId);
  } catch (error) {
    console.error("Unable to authorize lesson completion.", error);
    return { ok: false, code: "DATABASE" };
  }

  if (!profile?.completedAt || profile.userId !== userId) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const parsedLessonId = lessonIdSchema.safeParse(formData.get("lessonId"));
  if (!parsedLessonId.success) {
    return { ok: false, code: "INVALID" };
  }

  let curriculum;
  try {
    curriculum = await findPublishedLessonForCompletion(
      parsedLessonId.data,
    );
  } catch (error) {
    console.error("Unable to authorize the published lesson.", error);
    return { ok: false, code: "DATABASE" };
  }

  if (!curriculum) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const lessonId = new Types.ObjectId(parsedLessonId.data);
  const now = new Date();

  try {
    // Deterministic unique-index build before the first write: concurrent
    // completions from two tabs converge via the duplicate-key retry below.
    await ensureModelReady(LessonProgress, "LessonProgress");

    await LessonProgress.findOneAndUpdate(
      { userId, lessonId },
      {
        $set: {
          status: "completed",
          completedAt: now,
        },
        $setOnInsert: {
          startedAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      },
    ).exec();
  } catch (error) {
    // A concurrent tab may win the unique upsert race. It is already the
    // desired state, so retry as a non-upserting update for idempotency.
    if (!isDuplicateKeyError(error)) {
      console.error("Unable to persist lesson completion.", error);
      return { ok: false, code: "DATABASE" };
    }

    try {
      await LessonProgress.updateOne(
        { userId, lessonId },
        {
          $set: {
            status: "completed",
            completedAt: now,
          },
        },
      ).exec();
    } catch (retryError) {
      console.error("Unable to finish concurrent lesson completion.", retryError);
      return { ok: false, code: "DATABASE" };
    }
  }

  revalidatePath("/[locale]/learn", "layout");
  revalidatePath("/[locale]/app", "page");

  return { ok: true, lessonId: parsedLessonId.data };
}
