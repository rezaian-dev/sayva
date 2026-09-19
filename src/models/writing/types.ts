import type { Types } from "mongoose";

import type { LocalizedText } from "@/models/learning/types";
import type { ContentStatus } from "@/models/domain/common";

/**
 * Database-ready Writing task content.
 *
 * Writing prompts target English; Persian fields carry guidance,
 * translations of instructions, and evaluation support.
 * Learner submissions/grading are NOT part of this model.
 */
export type WritingItemRecord = {
  _id: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  prompt: LocalizedText;
  level?: string;
  topic?: string;
  taskType?: string;
  instructions: LocalizedText;
  audience?: string;
  purpose?: string;
  register?: string;
  recommendedLength?: string;
  targetLanguage: string;
  targetLanguageFeatures: string[];
  evaluationCriteria: LocalizedText[];
  lessonId?: Types.ObjectId;
  practiceSetId?: Types.ObjectId;
  status: ContentStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
