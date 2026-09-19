import type { Types } from "mongoose";

import type { LocalizedText } from "@/models/learning/types";
import type { ContentStatus } from "@/models/domain/common";

export type TranscriptVisibility = "hidden" | "on-request" | "always";

export type ListeningItemRecord = {
  _id: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  audioSrc: string;
  durationSeconds?: number;
  level?: string;
  transcript?: LocalizedText;
  transcriptVisibility: TranscriptVisibility;
  lessonId?: Types.ObjectId;
  practiceSetId?: Types.ObjectId;
  status: ContentStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
