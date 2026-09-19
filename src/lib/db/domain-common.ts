import { Types } from "mongoose";

import { ensureModelReady } from "@/lib/db/model-ready";
import { LearnerDomainProgress } from "@/models/domain/progress";
import type { DomainProgressName, DomainProgressState, LearnerDomainProgressRecord } from "@/models/domain/types";
import { PracticeSet } from "@/models/practice/set";

export async function publishedPracticeId(practiceSetId?: Types.ObjectId) {
  if (!practiceSetId) return null;
  const practice = await PracticeSet.findOne({
    _id: practiceSetId,
    status: "published",
  })
    .select({ _id: 1 })
    .lean<{ _id: Types.ObjectId }>()
    .exec();
  return practice?._id.toString() ?? null;
}

export async function getProgressMap(
  userId: string,
  domain: DomainProgressName,
  contentIds: Types.ObjectId[],
) {
  if (!contentIds.length) return new Map<string, DomainProgressState>();
  const records = await LearnerDomainProgress.find({
    userId,
    domain,
    contentId: { $in: contentIds },
  })
    .lean<LearnerDomainProgressRecord[]>()
    .exec();
  return new Map(records.map((record) => [record.contentId.toString(), record.state]));
}

export async function getProgress(
  userId: string,
  domain: DomainProgressName,
  contentId: Types.ObjectId,
) {
  return LearnerDomainProgress.findOne({ userId, domain, contentId })
    .lean<LearnerDomainProgressRecord>()
    .exec();
}

export async function saveProgress({
  userId,
  domain,
  contentId,
  state,
}: {
  userId: string;
  domain: DomainProgressName;
  contentId: Types.ObjectId;
  state: DomainProgressState;
}) {
  const now = new Date();
  const update = {
    $set: {
      state,
      ...(state === "completed" ? { completedAt: now } : {}),
    },
    $setOnInsert: { startedAt: now },
    ...(state === "completed" ? {} : { $unset: { completedAt: 1 } }),
  };

  try {
    // Deterministic unique-index build before the first write so
    // concurrent progress writes converge via the duplicate-key retry.
    await ensureModelReady(LearnerDomainProgress, "LearnerDomainProgress");

    return await LearnerDomainProgress.findOneAndUpdate(
      { userId, domain, contentId },
      update,
      { upsert: true, returnDocument: "after", runValidators: true },
    ).exec();
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return LearnerDomainProgress.findOneAndUpdate(
      { userId, domain, contentId },
      update,
      { returnDocument: "after", runValidators: true },
    ).exec();
  }
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
