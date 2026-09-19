"use server";

import { revalidatePath } from "next/cache";

import { getActionLearner } from "@/lib/domains/access";
import { createSpeakingAttempt, failSpeakingAttempt, getPublishedSpeakingScenario } from "@/lib/db/speaking";
import { speakingAttemptIdSchema, speakingScenarioIdSchema } from "@/validation/speaking/scenario";

export type StartSpeakingAttemptResult =
  | { ok: true; attemptId: string }
  | { ok: false; code: "UNAUTHORIZED" | "INVALID" | "NOT_FOUND" | "DATABASE" };

export async function startSpeakingAttempt(scenarioId: string): Promise<StartSpeakingAttemptResult> {
  try {
    const learner = await getActionLearner();
    if (!learner) return { ok: false, code: "UNAUTHORIZED" };
    const parsed = speakingScenarioIdSchema.safeParse({ scenarioId });
    if (!parsed.success) return { ok: false, code: "INVALID" };
    const scenario = await getPublishedSpeakingScenario(parsed.data.scenarioId);
    if (!scenario) return { ok: false, code: "NOT_FOUND" };
    const attemptId = await createSpeakingAttempt(learner.userId, scenario.id);
    revalidatePath("/[locale]/speaking", "layout");
    return { ok: true, attemptId };
  } catch (error) {
    console.error("Unable to start speaking attempt.", error);
    return { ok: false, code: "DATABASE" };
  }
}

export type CancelSpeakingAttemptResult =
  | { ok: true }
  | { ok: false; code: "UNAUTHORIZED" | "INVALID" | "NOT_FOUND" | "DATABASE" };

export async function cancelSpeakingAttempt(
  scenarioId: string,
  attemptId: string,
): Promise<CancelSpeakingAttemptResult> {
  try {
    const learner = await getActionLearner();
    if (!learner) return { ok: false, code: "UNAUTHORIZED" };
    const parsed = speakingAttemptIdSchema.safeParse({ scenarioId, attemptId });
    if (!parsed.success) return { ok: false, code: "INVALID" };
    const cancelled = await failSpeakingAttempt(
      learner.userId,
      parsed.data.scenarioId,
      parsed.data.attemptId,
      "CANCELLED",
    );
    if (!cancelled) return { ok: false, code: "NOT_FOUND" };
    revalidatePath("/[locale]/speaking", "layout");
    return { ok: true };
  } catch (error) {
    console.error("Unable to cancel speaking attempt.", error);
    return { ok: false, code: "DATABASE" };
  }
}
