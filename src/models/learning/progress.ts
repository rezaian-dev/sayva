import mongoose, { Schema } from "mongoose";

import type { LessonProgressRecord } from "@/models/learning/types";

const lessonProgressSchema = new Schema<LessonProgressRecord>(
  {
    userId: { type: String, required: true, trim: true },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "LearningLesson",
      required: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      required: true,
    },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  {
    collection: "learning_lesson_progress",
    timestamps: true,
    strict: true,
  },
);

// One authoritative progress document per learner and lesson. This is a
// database constraint, not just a client-side duplicate-submission check.
lessonProgressSchema.index(
  { userId: 1, lessonId: 1 },
  { unique: true, name: "progress_user_lesson_unique" },
);
lessonProgressSchema.index(
  { userId: 1, status: 1, updatedAt: -1 },
  { name: "progress_user_status_updated" },
);

export const LessonProgress =
  mongoose.models.LessonProgress ??
  mongoose.model<LessonProgressRecord>("LessonProgress", lessonProgressSchema);
