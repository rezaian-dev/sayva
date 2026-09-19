import type { Types } from "mongoose";

import type { LocalizedText } from "@/models/learning/types";
import type { ContentStatus } from "@/models/domain/common";

export type ReadingSection = {
  heading?: LocalizedText;
  paragraphs: LocalizedText[];
};

export type ReadingItemRecord = {
  _id: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  level?: string;
  sections: ReadingSection[];
  estimatedDuration?: number;
  lessonId?: Types.ObjectId;
  practiceSetId?: Types.ObjectId;
  status: ContentStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
