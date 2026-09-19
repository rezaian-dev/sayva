import type { Types } from "mongoose";

import type { LocalizedText } from "@/models/learning/types";

export const practiceExerciseTypes = [
  "multiple-choice",
  "fill-blank",
  "matching",
  "ordering",
] as const;

export type PracticeExerciseType = (typeof practiceExerciseTypes)[number];
export type PracticeContentStatus = "draft" | "published" | "archived";

export type PracticeSetRecord = {
  _id: Types.ObjectId;
  lessonId: Types.ObjectId;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  status: PracticeContentStatus;
  createdAt: Date;
  updatedAt: Date;
};

type PracticeExerciseBase = {
  _id: Types.ObjectId;
  practiceSetId: Types.ObjectId;
  prompt: LocalizedText;
  instruction?: LocalizedText;
  order: number;
  status: PracticeContentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type MultipleChoiceExerciseRecord = PracticeExerciseBase & {
  exerciseType: "multiple-choice";
  options: Array<{ id: string; label: LocalizedText }>;
  correctOptionId: string;
};

export type FillBlankExerciseRecord = PracticeExerciseBase & {
  exerciseType: "fill-blank";
  acceptedAnswers: string[];
  caseSensitive: boolean;
};

export type MatchingExerciseRecord = PracticeExerciseBase & {
  exerciseType: "matching";
  leftItems: Array<{ id: string; label: LocalizedText }>;
  rightItems: Array<{ id: string; label: LocalizedText }>;
  pairs: Array<{ leftId: string; rightId: string }>;
};

export type OrderingExerciseRecord = PracticeExerciseBase & {
  exerciseType: "ordering";
  items: Array<{ id: string; label: LocalizedText }>;
  correctOrder: string[];
};

export type PracticeExerciseRecord =
  | MultipleChoiceExerciseRecord
  | FillBlankExerciseRecord
  | MatchingExerciseRecord
  | OrderingExerciseRecord;

export type MultipleChoiceResponse = {
  type: "multiple-choice";
  optionId: string;
};

export type FillBlankResponse = {
  type: "fill-blank";
  answer: string;
};

export type MatchingResponse = {
  type: "matching";
  pairs: Array<{ leftId: string; rightId: string }>;
};

export type OrderingResponse = {
  type: "ordering";
  itemIds: string[];
};

export type PracticeResponse =
  | MultipleChoiceResponse
  | FillBlankResponse
  | MatchingResponse
  | OrderingResponse;

export type PracticeAttemptRecord = {
  learnerId: string;
  sessionId: Types.ObjectId;
  exerciseId: Types.ObjectId;
  exerciseType: PracticeExerciseType;
  response: PracticeResponse;
  isCorrect: boolean;
  evaluationVersion: 1;
  submittedAt: Date;
};

export type PracticeResultRecord = {
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  completedAt: Date;
};

export type PracticeSessionRecord = {
  _id: Types.ObjectId;
  userId: string;
  practiceSetId: Types.ObjectId;
  exerciseOrder: Types.ObjectId[];
  currentIndex: number;
  status: "active" | "completed";
  attempts: PracticeAttemptRecord[];
  result?: PracticeResultRecord;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
