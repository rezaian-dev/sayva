import type { Types } from "mongoose";

import type { LocalizedText } from "@/models/learning/types";
import type { ContentStatus } from "@/models/domain/common";

export type SpeakingScenarioRecord = {
  _id: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  instructions: LocalizedText;
  context: LocalizedText;
  role: LocalizedText;
  objective: LocalizedText;
  successCriteria: LocalizedText[];
  preparationTips: LocalizedText[];
  level?: string;
  topic?: string;
  durationLimitSeconds: number;
  expectedLanguage: string;
  status: ContentStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SpeakingAttemptStatus = "started" | "recorded" | "processing" | "completed" | "failed";
export type SpeakingFailureCode =
  | "CANCELLED"
  | "INVALID_AUDIO"
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "TRANSCRIPTION_FAILED"
  | "FEEDBACK_FAILED"
  | "AI_OUTPUT_INVALID"
  | "PROCESSING_TIMEOUT"
  | "PROCESSING_FAILED";

export type SpeakingFeedbackRecord = {
  overallFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  grammarNotes: string[];
  vocabularySuggestions: string[];
  fluencyNotes: string[];
  correctionExamples: Array<{
    original: string;
    improved: string;
    explanation: string;
  }>;
  nextAttemptSuggestion: string;
};

export type SpeakingAttemptRecord = {
  _id: Types.ObjectId;
  userId: string;
  scenarioId: Types.ObjectId;
  status: SpeakingAttemptStatus;
  transcript?: string;
  feedback?: SpeakingFeedbackRecord;
  failureCode?: SpeakingFailureCode;
  startedAt: Date;
  recordedAt?: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
