import mongoose, { Schema } from "mongoose";

import type { PracticeSetRecord } from "@/models/practice/types";

const localizedTextSchema = new Schema(
  {
    fa: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

const practiceSetSchema = new Schema<PracticeSetRecord>(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: "LearningLesson", required: true },
    slug: { type: String, required: true, trim: true },
    title: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    order: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      required: true,
      default: "draft",
    },
  },
  {
    collection: "practice_sets",
    timestamps: true,
    strict: true,
  },
);

practiceSetSchema.index({ lessonId: 1, order: 1 });
practiceSetSchema.index({ status: 1, lessonId: 1 });
practiceSetSchema.index({ lessonId: 1, slug: 1 }, { unique: true });

export const PracticeSet =
  mongoose.models.PracticeSet ??
  mongoose.model<PracticeSetRecord>("PracticeSet", practiceSetSchema);
