import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongodb";
import { getProgress, getProgressMap, publishedPracticeId } from "@/lib/db/domain-common";
import { VocabularyItem } from "@/models/vocabulary/item";
import type { VocabularyItemRecord } from "@/models/vocabulary/types";
import type { VocabularyDetail, VocabularyListItem } from "@/lib/domains/types";

const published = { status: "published" as const };
const listLimit = 24;

function toListItem(
  item: VocabularyItemRecord,
  state: VocabularyListItem["state"],
  practice: VocabularyListItem["practice"],
): VocabularyListItem {
  return {
    id: item._id.toString(),
    slug: item.slug,
    word: item.word,
    partOfSpeech: item.partOfSpeech,
    translation: item.translation,
    level: item.level,
    state,
    practice,
  };
}

export async function getVocabularyHomeData(userId: string) {
  await connectToDatabase();
  const items = await VocabularyItem.find(published)
    .sort({ order: 1, _id: 1 })
    .limit(listLimit)
    .lean<VocabularyItemRecord[]>()
    .exec();
  const progress = await getProgressMap(userId, "vocabulary", items.map((item) => item._id));
  const practiceIds = await Promise.all(items.map((item) => publishedPracticeId(item.practiceSetId)));

  return {
    items: items.map((item, index) =>
      toListItem(item, (progress.get(item._id.toString()) as VocabularyListItem["state"] | undefined) ?? "new", practiceIds[index] ? { practiceSetId: practiceIds[index]! } : null),
    ),
  };
}

export async function getVocabularyDetailData(userId: string, itemId: string): Promise<VocabularyDetail | null> {
  if (!Types.ObjectId.isValid(itemId)) return null;
  await connectToDatabase();
  const item = await VocabularyItem.findOne({ ...published, _id: new Types.ObjectId(itemId) })
    .lean<VocabularyItemRecord>()
    .exec();
  if (!item) return null;
  const [progress, practiceSetId] = await Promise.all([
    getProgress(userId, "vocabulary", item._id),
    publishedPracticeId(item.practiceSetId),
  ]);
  const listItem = toListItem(item, (progress?.state as VocabularyListItem["state"] | undefined) ?? "new", practiceSetId ? { practiceSetId } : null);

  return {
    ...listItem,
    definition: item.definition,
    examples: item.examples,
    pronunciation: item.pronunciation,
  };
}

export async function findPublishedVocabularyItem(itemId: string) {
  if (!Types.ObjectId.isValid(itemId)) return null;
  await connectToDatabase();
  return VocabularyItem.findOne({ ...published, _id: new Types.ObjectId(itemId) })
    .lean<VocabularyItemRecord>()
    .exec();
}
