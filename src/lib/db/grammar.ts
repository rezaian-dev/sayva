import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongodb";
import { getProgress, getProgressMap, publishedPracticeId } from "@/lib/db/domain-common";
import { GrammarTopic } from "@/models/grammar/topic";
import type { GrammarTopicRecord } from "@/models/grammar/types";
import type { GrammarDetail, GrammarListItem } from "@/lib/domains/types";

const published = { status: "published" as const };
const listLimit = 24;

function toListItem(item: GrammarTopicRecord, state: GrammarListItem["state"], practice: GrammarListItem["practice"]): GrammarListItem {
  return {
    id: item._id.toString(),
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    level: item.level,
    state,
    practice,
  };
}

export async function getGrammarHomeData(userId: string) {
  await connectToDatabase();
  const topics = await GrammarTopic.find(published)
    .sort({ order: 1, _id: 1 })
    .limit(listLimit)
    .lean<GrammarTopicRecord[]>()
    .exec();
  const progress = await getProgressMap(userId, "grammar", topics.map((topic) => topic._id));
  const practiceIds = await Promise.all(topics.map((topic) => publishedPracticeId(topic.practiceSetId)));

  return {
    topics: topics.map((topic, index) =>
      toListItem(topic, (progress.get(topic._id.toString()) as GrammarListItem["state"] | undefined) ?? null, practiceIds[index] ? { practiceSetId: practiceIds[index]! } : null),
    ),
  };
}

export async function getGrammarDetailData(userId: string, topicId: string): Promise<GrammarDetail | null> {
  if (!Types.ObjectId.isValid(topicId)) return null;
  await connectToDatabase();
  const topic = await GrammarTopic.findOne({ ...published, _id: new Types.ObjectId(topicId) })
    .lean<GrammarTopicRecord>()
    .exec();
  if (!topic) return null;
  const [progress, practiceSetId] = await Promise.all([
    getProgress(userId, "grammar", topic._id),
    publishedPracticeId(topic.practiceSetId),
  ]);
  return {
    ...toListItem(topic, (progress?.state as GrammarListItem["state"] | undefined) ?? null, practiceSetId ? { practiceSetId } : null),
    explanation: topic.explanation,
    examples: topic.examples,
    commonMistakes: topic.commonMistakes,
  };
}

export async function findPublishedGrammarTopic(topicId: string) {
  if (!Types.ObjectId.isValid(topicId)) return null;
  await connectToDatabase();
  return GrammarTopic.findOne({ ...published, _id: new Types.ObjectId(topicId) })
    .lean<GrammarTopicRecord>()
    .exec();
}
