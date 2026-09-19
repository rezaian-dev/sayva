"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { getActionLearner } from "@/lib/domains/access";
import type { DomainProgressResult } from "@/lib/domains/types";
import { saveProgress } from "@/lib/db/domain-common";
import { findPublishedListeningItem } from "@/lib/db/listening";
import { listeningProgressSchema } from "@/validation/listening/progress";

export type UpdateListeningProgressResult = DomainProgressResult;

export async function updateListeningProgress(
  _previous: UpdateListeningProgressResult | null,
  formData: FormData,
): Promise<UpdateListeningProgressResult> {
  try {
    const learner = await getActionLearner();
    if (!learner) return { ok: false, code: "UNAUTHORIZED" };
    const parsed = listeningProgressSchema.safeParse({
      itemId: formData.get("itemId"),
      state: formData.get("state"),
    });
    if (!parsed.success) return { ok: false, code: "INVALID" };
    const item = await findPublishedListeningItem(parsed.data.itemId);
    if (!item) return { ok: false, code: "NOT_FOUND" };

    await saveProgress({
      userId: learner.userId,
      domain: "listening",
      contentId: new Types.ObjectId(parsed.data.itemId),
      state: parsed.data.state,
    });
    revalidatePath("/[locale]/listening", "layout");
    return { ok: true, state: parsed.data.state };
  } catch (error) {
    console.error("Unable to update listening progress.", error);
    return { ok: false, code: "DATABASE" };
  }
}
