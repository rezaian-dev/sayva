import type { Types } from "mongoose";

import type { LocalizedText } from "@/models/learning/types";
import type { ContentStatus } from "@/models/domain/common";

export type GrammarExample = {
  sentence: string;
  translation?: string;
  note?: LocalizedText;
};

export type GrammarMistake = {
  mistake: LocalizedText;
  correction: LocalizedText;
};

export type GrammarTopicRecord = {
  _id: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  level?: string;
  summary: LocalizedText;
  explanation: LocalizedText;
  examples: GrammarExample[];
  commonMistakes: GrammarMistake[];
  lessonId?: Types.ObjectId;
  practiceSetId?: Types.ObjectId;
  status: ContentStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
