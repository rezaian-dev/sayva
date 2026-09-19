import mongoose, { Schema } from "mongoose";

import type { PracticeSessionRecord } from "@/models/practice/types";

const attemptSchema = new Schema(
  {
    learnerId: { type: String, required: true },
    sessionId: { type: Schema.Types.ObjectId, required: true },
    exerciseId: { type: Schema.Types.ObjectId, required: true },
    exerciseType: {
      type: String,
      enum: ["multiple-choice", "fill-blank", "matching", "ordering"],
      required: true,
    },
    response: { type: Schema.Types.Mixed, required: true },
    isCorrect: { type: Boolean, required: true },
    evaluationVersion: { type: Number, enum: [1], required: true },
    submittedAt: { type: Date, required: true },
  },
  { _id: false, strict: true },
);

const resultSchema = new Schema(
  {
    correctCount: { type: Number, required: true, min: 0 },
    totalCount: { type: Number, required: true, min: 1 },
    scorePercent: { type: Number, required: true, min: 0, max: 100 },
    completedAt: { type: Date, required: true },
  },
  { _id: false, strict: true },
);

const practiceSessionSchema = new Schema<PracticeSessionRecord>(
  {
    userId: { type: String, required: true, index: true },
    practiceSetId: { type: Schema.Types.ObjectId, ref: "PracticeSet", required: true },
    exerciseOrder: {
      type: [{ type: Schema.Types.ObjectId, required: true }],
      required: true,
      validate: (items: unknown[]) => items.length > 0,
    },
    currentIndex: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: ["active", "completed"], required: true, default: "active" },
    attempts: { type: [attemptSchema], required: true, default: [] },
    result: { type: resultSchema },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  {
    collection: "practice_sessions",
    timestamps: true,
    strict: true,
  },
);

// Phase 8 progress reads aggregate completed sessions and read recent sessions per learner.
practiceSessionSchema.index({ userId: 1, status: 1, completedAt: -1 });
practiceSessionSchema.index(
  { userId: 1, practiceSetId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);

export const PracticeSession =
  mongoose.models.PracticeSession ??
  mongoose.model<PracticeSessionRecord>("PracticeSession", practiceSessionSchema);
