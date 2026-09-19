import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongodb";
import { getProgress, getProgressMap, publishedPracticeId } from "@/lib/db/domain-common";
import { ListeningItem } from "@/models/listening/item";
import type { ListeningItemRecord } from "@/models/listening/types";
import type { ListeningDetail, ListeningListItem } from "@/lib/domains/types";

const published = { status: "published" as const };
const listLimit = 24;

function toListItem(item: ListeningItemRecord, state: ListeningListItem["state"], practice: ListeningListItem["practice"]): ListeningListItem {
  return {
    id: item._id.toString(),
    slug: item.slug,
    title: item.title,
    description: item.description,
    durationSeconds: item.durationSeconds,
    level: item.level,
    state,
    practice,
  };
}

export async function getListeningHomeData(userId: string) {
  await connectToDatabase();
  const items = await ListeningItem.find(published)
    .sort({ order: 1, _id: 1 })
    .limit(listLimit)
    .lean<ListeningItemRecord[]>()
    .exec();
  const progress = await getProgressMap(userId, "listening", items.map((item) => item._id));
  const practiceIds = await Promise.all(items.map((item) => publishedPracticeId(item.practiceSetId)));

  return {
    items: items.map((item, index) =>
      toListItem(item, (progress.get(item._id.toString()) as ListeningListItem["state"] | undefined) ?? null, practiceIds[index] ? { practiceSetId: practiceIds[index]! } : null),
    ),
  };
}

export async function getListeningDetailData(userId: string, itemId: string): Promise<ListeningDetail | null> {
  if (!Types.ObjectId.isValid(itemId)) return null;
  await connectToDatabase();
  const item = await ListeningItem.findOne({ ...published, _id: new Types.ObjectId(itemId) })
    .lean<ListeningItemRecord>()
    .exec();
  if (!item) return null;
  const [progress, practiceSetId] = await Promise.all([
    getProgress(userId, "listening", item._id),
    publishedPracticeId(item.practiceSetId),
  ]);
  return {
    ...toListItem(item, (progress?.state as ListeningListItem["state"] | undefined) ?? null, practiceSetId ? { practiceSetId } : null),
    audioSrc: item.audioSrc,
    transcript: item.transcript,
    transcriptVisibility: item.transcriptVisibility,
  };
}

export async function findPublishedListeningItem(itemId: string) {
  if (!Types.ObjectId.isValid(itemId)) return null;
  await connectToDatabase();
  return ListeningItem.findOne({ ...published, _id: new Types.ObjectId(itemId) })
    .lean<ListeningItemRecord>()
    .exec();
}
