"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { getActionLearner } from "@/lib/domains/access";
import { saveProgress } from "@/lib/db/domain-common";
import { findPublishedVocabularyItem } from "@/lib/db/vocabulary";
import type { VocabularyState } from "@/lib/vocabulary/rules";
import { vocabularyStateSchema } from "@/validation/vocabulary/state";

export type UpdateVocabularyResult =
  | { ok: true; state: VocabularyState }
  | { ok: false; code: "UNAUTHORIZED" | "INVALID" | "NOT_FOUND" | "DATABASE" };

export async function updateVocabularyState(
  _previous: UpdateVocabularyResult | null,
  formData: FormData,
): Promise<UpdateVocabularyResult> {
  try {
    const learner = await getActionLearner();
    if (!learner) return { ok: false, code: "UNAUTHORIZED" };

    const parsed = vocabularyStateSchema.safeParse({
      itemId: formData.get("itemId"),
      state: formData.get("state"),
    });
    if (!parsed.success) return { ok: false, code: "INVALID" };

    const item = await findPublishedVocabularyItem(parsed.data.itemId);
    if (!item) return { ok: false, code: "NOT_FOUND" };

    await saveProgress({
      userId: learner.userId,
      domain: "vocabulary",
      contentId: new Types.ObjectId(parsed.data.itemId),
      state: parsed.data.state,
    });
    revalidatePath("/[locale]/vocabulary", "layout");
    return { ok: true, state: parsed.data.state };
  } catch (error) {
    console.error("Unable to update vocabulary state.", error);
    return { ok: false, code: "DATABASE" };
  }
}
