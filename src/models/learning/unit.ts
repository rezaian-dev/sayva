import mongoose, { Schema } from "mongoose";

import { curriculumStatuses } from "@/lib/learning/constants";
import type { UnitRecord } from "@/models/learning/types";

const localizedTextSchema = new Schema(
  {
    fa: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

const unitSchema = new Schema<UnitRecord>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "LearningCourse", required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: curriculumStatuses, required: true },
  },
  {
    collection: "learning_units",
    timestamps: true,
    strict: true,
  },
);

unitSchema.index(
  { courseId: 1, slug: 1 },
  { unique: true, name: "unit_course_slug_unique" },
);
unitSchema.index(
  { courseId: 1, order: 1 },
  { unique: true, name: "unit_course_order_unique" },
);
unitSchema.index(
  { courseId: 1, status: 1, order: 1 },
  { name: "unit_course_status_order" },
);

export const LearningUnit =
  mongoose.models.LearningUnit ??
  mongoose.model<UnitRecord>("LearningUnit", unitSchema);
