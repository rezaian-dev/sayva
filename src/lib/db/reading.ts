import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongodb";
import { getProgress, getProgressMap, publishedPracticeId } from "@/lib/db/domain-common";
import { ReadingItem } from "@/models/reading/item";
import type { ReadingItemRecord } from "@/models/reading/types";
import type { ReadingDetail, ReadingListItem } from "@/lib/domains/types";

const published = { status: "published" as const };
const listLimit = 24;

function toListItem(item: ReadingItemRecord, state: ReadingListItem["state"], practice: ReadingListItem["practice"]): ReadingListItem {
  return {
    id: item._id.toString(),
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    level: item.level,
    estimatedDuration: item.estimatedDuration,
    state,
    practice,
  };
}

export async function getReadingHomeData(userId: string) {
  await connectToDatabase();
  const items = await ReadingItem.find(published)
    .sort({ order: 1, _id: 1 })
    .limit(listLimit)
    .lean<ReadingItemRecord[]>()
    .exec();
  const progress = await getProgressMap(userId, "reading", items.map((item) => item._id));
  const practiceIds = await Promise.all(items.map((item) => publishedPracticeId(item.practiceSetId)));

  return {
    items: items.map((item, index) =>
      toListItem(item, (progress.get(item._id.toString()) as ReadingListItem["state"] | undefined) ?? null, practiceIds[index] ? { practiceSetId: practiceIds[index]! } : null),
    ),
  };
}

export async function getReadingDetailData(userId: string, itemId: string): Promise<ReadingDetail | null> {
  if (!Types.ObjectId.isValid(itemId)) return null;
  await connectToDatabase();
  const item = await ReadingItem.findOne({ ...published, _id: new Types.ObjectId(itemId) })
    .lean<ReadingItemRecord>()
    .exec();
  if (!item) return null;
  const [progress, practiceSetId] = await Promise.all([
    getProgress(userId, "reading", item._id),
    publishedPracticeId(item.practiceSetId),
  ]);
  return {
    ...toListItem(item, (progress?.state as ReadingListItem["state"] | undefined) ?? null, practiceSetId ? { practiceSetId } : null),
    sections: item.sections,
  };
}

export async function findPublishedReadingItem(itemId: string) {
  if (!Types.ObjectId.isValid(itemId)) return null;
  await connectToDatabase();
  return ReadingItem.findOne({ ...published, _id: new Types.ObjectId(itemId) })
    .lean<ReadingItemRecord>()
    .exec();
}
