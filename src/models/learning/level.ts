import mongoose, { Schema } from "mongoose";

import { curriculumStatuses } from "@/lib/learning/constants";
import type { LevelRecord } from "@/models/learning/types";

const localizedTextSchema = new Schema(
  {
    fa: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

const levelSchema = new Schema<LevelRecord>(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: curriculumStatuses, required: true },
  },
  {
    collection: "learning_levels",
    timestamps: true,
    strict: true,
  },
);

levelSchema.index({ slug: 1 }, { unique: true, name: "level_slug_unique" });
levelSchema.index(
  { status: 1, order: 1 },
  { name: "level_published_order" },
);
levelSchema.index(
  { status: 1, slug: 1 },
  { name: "level_status_slug" },
);

export const LearningLevel =
  mongoose.models.LearningLevel ??
  mongoose.model<LevelRecord>("LearningLevel", levelSchema);
