import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongodb";
import { GrammarTopic } from "@/models/grammar/topic";
import { LearningCourse } from "@/models/learning/course";
import { LearningLesson } from "@/models/learning/lesson";
import { LearningLevel } from "@/models/learning/level";
import { LearningUnit } from "@/models/learning/unit";
import { ListeningItem } from "@/models/listening/item";
import { PracticeExercise } from "@/models/practice/exercise";
import { PracticeSet } from "@/models/practice/set";
import { ReadingItem } from "@/models/reading/item";
import { SpeakingScenario } from "@/models/speaking/scenario";
import { VocabularyItem } from "@/models/vocabulary/item";
import type { ContentStatus } from "@/models/domain/common";
import type { GrammarTopicRecord } from "@/models/grammar/types";
import type { CourseRecord, LessonRecord, LevelRecord, UnitRecord } from "@/models/learning/types";
import type { ListeningItemRecord } from "@/models/listening/types";
import type { PracticeExerciseRecord, PracticeSetRecord } from "@/models/practice/types";
import type { ReadingItemRecord } from "@/models/reading/types";
import type { SpeakingScenarioRecord } from "@/models/speaking/types";
import type { VocabularyItemRecord } from "@/models/vocabulary/types";

export const adminListLimit = 40;
export const adminPageSize = 20;

export type AdminContentDomain = "vocabulary" | "grammar" | "listening" | "reading" | "speaking";
export const adminContentDomains: AdminContentDomain[] = ["vocabulary", "grammar", "listening", "reading", "speaking"];

function safeObjectId(value: string) {
  return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

function pageOffset(page: number) {
  return Math.max(0, (Number.isInteger(page) && page > 0 ? page : 1) - 1) * adminPageSize;
}

export async function getAdminOverviewData() {
  await connectToDatabase();
  const [levels, vocabulary, grammar, listening, reading, speaking, practiceSets] = await Promise.all([
    LearningLevel.countDocuments().exec(),
    VocabularyItem.countDocuments().exec(),
    GrammarTopic.countDocuments().exec(),
    ListeningItem.countDocuments().exec(),
    ReadingItem.countDocuments().exec(),
    SpeakingScenario.countDocuments().exec(),
    PracticeSet.countDocuments().exec(),
  ]);
  return { levels, vocabulary, grammar, listening, reading, speaking, practiceSets };
}

export async function getAdminContentList(domain: AdminContentDomain, status: ContentStatus | undefined, level: string | undefined, page = 1) {
  await connectToDatabase();
  const filter = { ...(status ? { status } : {}), ...(level ? { level } : {}) };
  const skip = pageOffset(page);
  switch (domain) {
    case "vocabulary": {
      const [items, total] = await Promise.all([
        VocabularyItem.find(filter).sort({ order: 1, _id: 1 }).skip(skip).limit(adminPageSize).select({ slug: 1, word: 1, level: 1, order: 1, status: 1, updatedAt: 1 }).lean<Pick<VocabularyItemRecord, "_id" | "slug" | "word" | "level" | "order" | "status" | "updatedAt">[]>().exec(),
        VocabularyItem.countDocuments(filter).exec(),
      ]);
      return { domain, items, total, page };
    }
    case "grammar": {
      const [items, total] = await Promise.all([
        GrammarTopic.find(filter).sort({ order: 1, _id: 1 }).skip(skip).limit(adminPageSize).select({ slug: 1, title: 1, level: 1, order: 1, status: 1, updatedAt: 1 }).lean<Pick<GrammarTopicRecord, "_id" | "slug" | "title" | "level" | "order" | "status" | "updatedAt">[]>().exec(),
        GrammarTopic.countDocuments(filter).exec(),
      ]);
      return { domain, items, total, page };
    }
    case "listening": {
      const [items, total] = await Promise.all([
        ListeningItem.find(filter).sort({ order: 1, _id: 1 }).skip(skip).limit(adminPageSize).select({ slug: 1, title: 1, level: 1, order: 1, status: 1, updatedAt: 1 }).lean<Pick<ListeningItemRecord, "_id" | "slug" | "title" | "level" | "order" | "status" | "updatedAt">[]>().exec(),
        ListeningItem.countDocuments(filter).exec(),
      ]);
      return { domain, items, total, page };
    }
    case "reading": {
      const [items, total] = await Promise.all([
        ReadingItem.find(filter).sort({ order: 1, _id: 1 }).skip(skip).limit(adminPageSize).select({ slug: 1, title: 1, level: 1, order: 1, status: 1, updatedAt: 1 }).lean<Pick<ReadingItemRecord, "_id" | "slug" | "title" | "level" | "order" | "status" | "updatedAt">[]>().exec(),
        ReadingItem.countDocuments(filter).exec(),
      ]);
      return { domain, items, total, page };
    }
    case "speaking": {
      const [items, total] = await Promise.all([
        SpeakingScenario.find(filter).sort({ order: 1, _id: 1 }).skip(skip).limit(adminPageSize).select({ slug: 1, title: 1, level: 1, order: 1, status: 1, updatedAt: 1 }).lean<Pick<SpeakingScenarioRecord, "_id" | "slug" | "title" | "level" | "order" | "status" | "updatedAt">[]>().exec(),
        SpeakingScenario.countDocuments(filter).exec(),
      ]);
      return { domain, items, total, page };
    }
  }
}

export async function getAdminContent(domain: AdminContentDomain, id: string) {
  await connectToDatabase();
  const objectId = safeObjectId(id);
  if (!objectId) return null;
  switch (domain) {
    case "vocabulary": return VocabularyItem.findById(objectId).lean<VocabularyItemRecord>().exec();
    case "grammar": return GrammarTopic.findById(objectId).lean<GrammarTopicRecord>().exec();
    case "listening": return ListeningItem.findById(objectId).lean<ListeningItemRecord>().exec();
    case "reading": return ReadingItem.findById(objectId).lean<ReadingItemRecord>().exec();
    case "speaking": return SpeakingScenario.findById(objectId).lean<SpeakingScenarioRecord>().exec();
  }
}

export async function getAdminCurriculumData() {
  await connectToDatabase();
  const [levels, courses, units, lessons] = await Promise.all([
    LearningLevel.find().sort({ order: 1, _id: 1 }).limit(adminListLimit).lean<LevelRecord[]>().exec(),
    LearningCourse.find().sort({ order: 1, _id: 1 }).limit(adminListLimit).lean<CourseRecord[]>().exec(),
    LearningUnit.find().sort({ order: 1, _id: 1 }).limit(adminListLimit).lean<UnitRecord[]>().exec(),
    LearningLesson.find().sort({ order: 1, _id: 1 }).limit(adminListLimit).lean<LessonRecord[]>().exec(),
  ]);
  return { levels, courses, units, lessons };
}

export type AdminCurriculumEntity = "level" | "course" | "unit" | "lesson";

export async function getAdminCurriculumRecord(entity: AdminCurriculumEntity, id: string) {
  await connectToDatabase();
  const objectId = safeObjectId(id);
  if (!objectId) return null;
  if (entity === "level") return LearningLevel.findById(objectId).lean<LevelRecord>().exec();
  if (entity === "course") return LearningCourse.findById(objectId).lean<CourseRecord>().exec();
  if (entity === "unit") return LearningUnit.findById(objectId).lean<UnitRecord>().exec();
  return LearningLesson.findById(objectId).lean<LessonRecord>().exec();
}

export async function getAdminPracticeData() {
  await connectToDatabase();
  const [sets, exercises] = await Promise.all([
    PracticeSet.find().sort({ order: 1, _id: 1 }).limit(adminListLimit).lean<PracticeSetRecord[]>().exec(),
    PracticeExercise.find().sort({ order: 1, _id: 1 }).limit(adminListLimit).lean<PracticeExerciseRecord[]>().exec(),
  ]);
  return { sets, exercises };
}
