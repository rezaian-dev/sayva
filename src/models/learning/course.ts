import mongoose, { Schema } from "mongoose";

import { curriculumStatuses } from "@/lib/learning/constants";
import type { CourseRecord } from "@/models/learning/types";

const localizedTextSchema = new Schema(
  {
    fa: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

const courseSchema = new Schema<CourseRecord>(
  {
    levelId: { type: Schema.Types.ObjectId, ref: "LearningLevel", required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: curriculumStatuses, required: true },
  },
  {
    collection: "learning_courses",
    timestamps: true,
    strict: true,
  },
);

courseSchema.index(
  { levelId: 1, slug: 1 },
  { unique: true, name: "course_level_slug_unique" },
);
courseSchema.index(
  { levelId: 1, order: 1 },
  { unique: true, name: "course_level_order_unique" },
);
courseSchema.index(
  { levelId: 1, status: 1, order: 1 },
  { name: "course_level_status_order" },
);

export const LearningCourse =
  mongoose.models.LearningCourse ??
  mongoose.model<CourseRecord>("LearningCourse", courseSchema);
