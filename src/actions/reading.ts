"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { getActionLearner } from "@/lib/domains/access";
import type { DomainProgressResult } from "@/lib/domains/types";
import { saveProgress } from "@/lib/db/domain-common";
import { findPublishedReadingItem } from "@/lib/db/reading";
import { readingProgressSchema } from "@/validation/reading/progress";

export type UpdateReadingProgressResult = DomainProgressResult;

export async function updateReadingProgress(
  _previous: UpdateReadingProgressResult | null,
  formData: FormData,
): Promise<UpdateReadingProgressResult> {
  try {
    const learner = await getActionLearner();
    if (!learner) return { ok: false, code: "UNAUTHORIZED" };
    const parsed = readingProgressSchema.safeParse({
      itemId: formData.get("itemId"),
      state: formData.get("state"),
    });
    if (!parsed.success) return { ok: false, code: "INVALID" };
    const item = await findPublishedReadingItem(parsed.data.itemId);
    if (!item) return { ok: false, code: "NOT_FOUND" };

    await saveProgress({
      userId: learner.userId,
      domain: "reading",
      contentId: new Types.ObjectId(parsed.data.itemId),
      state: parsed.data.state,
    });
    revalidatePath("/[locale]/reading", "layout");
    return { ok: true, state: parsed.data.state };
  } catch (error) {
    console.error("Unable to update reading progress.", error);
    return { ok: false, code: "DATABASE" };
  }
}
