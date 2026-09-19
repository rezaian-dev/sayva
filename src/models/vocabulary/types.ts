import type { Types } from "mongoose";

import type { LocalizedText } from "@/models/learning/types";
import type { ContentStatus } from "@/models/domain/common";

export type VocabularyExample = {
  sentence: string;
  translation?: string;
};

export type VocabularyItemRecord = {
  _id: Types.ObjectId;
  slug: string;
  word: string;
  normalizedWord: string;
  partOfSpeech?: string;
  definition: LocalizedText;
  translation: LocalizedText;
  examples: VocabularyExample[];
  pronunciation?: {
    ipa?: string;
    audioSrc?: string;
  };
  level?: string;
  lessonId?: Types.ObjectId;
  practiceSetId?: Types.ObjectId;
  status: ContentStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
