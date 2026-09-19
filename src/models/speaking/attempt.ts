import mongoose, { Schema } from "mongoose";

import type { SpeakingAttemptRecord, SpeakingFailureCode, SpeakingFeedbackRecord } from "@/models/speaking/types";

const correctionExampleSchema = new Schema<SpeakingFeedbackRecord["correctionExamples"][number]>(
  {
    original: { type: String, required: true, trim: true, maxlength: 500 },
    improved: { type: String, required: true, trim: true, maxlength: 500 },
    explanation: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false, strict: true },
);

const speakingFeedbackSchema = new Schema<SpeakingFeedbackRecord>(
  {
    overallFeedback: { type: String, required: true, trim: true, maxlength: 1600 },
    strengths: { type: [String], required: true, default: [] },
    areasToImprove: { type: [String], required: true, default: [] },
    grammarNotes: { type: [String], required: true, default: [] },
    vocabularySuggestions: { type: [String], required: true, default: [] },
    fluencyNotes: { type: [String], required: true, default: [] },
    correctionExamples: { type: [correctionExampleSchema], required: true, default: [] },
    nextAttemptSuggestion: { type: String, required: true, trim: true, maxlength: 800 },
  },
  { _id: false, strict: true },
);

const speakingAttemptSchema = new Schema<SpeakingAttemptRecord>(
  {
    userId: { type: String, required: true },
    scenarioId: { type: Schema.Types.ObjectId, ref: "SpeakingScenario", required: true },
    status: {
      type: String,
      enum: ["started", "recorded", "processing", "completed", "failed"],
      required: true,
      index: true,
    },
    transcript: { type: String, trim: true, maxlength: 12000 },
    feedback: { type: speakingFeedbackSchema },
    failureCode: {
      type: String,
      enum: [
        "CANCELLED",
        "INVALID_AUDIO",
        "AI_PROVIDER_NOT_CONFIGURED",
        "TRANSCRIPTION_FAILED",
        "FEEDBACK_FAILED",
        "AI_OUTPUT_INVALID",
        "PROCESSING_TIMEOUT",
        "PROCESSING_FAILED",
      ] satisfies SpeakingFailureCode[],
    },
    startedAt: { type: Date, required: true },
    recordedAt: { type: Date },
    processingStartedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
  },
  { collection: "ai_speaking_attempts", timestamps: true, strict: true },
);

speakingAttemptSchema.index({ userId: 1, createdAt: -1 });
speakingAttemptSchema.index({ userId: 1, scenarioId: 1, createdAt: -1 });

export const SpeakingAttempt =
  mongoose.models.SpeakingAttempt ??
  mongoose.model<SpeakingAttemptRecord>("SpeakingAttempt", speakingAttemptSchema);
