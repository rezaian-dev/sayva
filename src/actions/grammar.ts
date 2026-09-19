"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { getActionLearner } from "@/lib/domains/access";
import type { DomainProgressResult } from "@/lib/domains/types";
import { saveProgress } from "@/lib/db/domain-common";
import { findPublishedGrammarTopic } from "@/lib/db/grammar";
import { grammarProgressSchema } from "@/validation/grammar/progress";

export type UpdateGrammarProgressResult = DomainProgressResult;

export async function updateGrammarProgress(
  _previous: UpdateGrammarProgressResult | null,
  formData: FormData,
): Promise<UpdateGrammarProgressResult> {
  try {
    const learner = await getActionLearner();
    if (!learner) return { ok: false, code: "UNAUTHORIZED" };
    const parsed = grammarProgressSchema.safeParse({
      topicId: formData.get("topicId"),
      state: formData.get("state"),
    });
    if (!parsed.success) return { ok: false, code: "INVALID" };
    const topic = await findPublishedGrammarTopic(parsed.data.topicId);
    if (!topic) return { ok: false, code: "NOT_FOUND" };

    await saveProgress({
      userId: learner.userId,
      domain: "grammar",
      contentId: new Types.ObjectId(parsed.data.topicId),
      state: parsed.data.state,
    });
    revalidatePath("/[locale]/grammar", "layout");
    return { ok: true, state: parsed.data.state };
  } catch (error) {
    console.error("Unable to update grammar progress.", error);
    return { ok: false, code: "DATABASE" };
  }
}
