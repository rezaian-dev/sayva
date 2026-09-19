import mongoose, { Schema } from "mongoose";

import {
  curriculumStatuses,
  lessonContentKinds,
} from "@/lib/learning/constants";
import type { LessonRecord } from "@/models/learning/types";

const localizedTextSchema = new Schema(
  {
    fa: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

const lessonContentBlockSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    kind: { type: String, enum: lessonContentKinds, required: true },
    title: { type: localizedTextSchema, required: true },
    body: { type: localizedTextSchema, required: true },
    order: { type: Number, required: true, min: 0 },
  },
  { _id: false, strict: true },
);

const lessonSchema = new Schema<LessonRecord>(
  {
    unitId: { type: Schema.Types.ObjectId, ref: "LearningUnit", required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: curriculumStatuses, required: true },
    estimatedDuration: { type: Number, min: 1 },
    objectives: { type: [localizedTextSchema], required: true, default: [] },
    content: { type: [lessonContentBlockSchema], required: true, default: [] },
  },
  {
    collection: "learning_lessons",
    timestamps: true,
    strict: true,
  },
);

lessonSchema.index(
  { unitId: 1, slug: 1 },
  { unique: true, name: "lesson_unit_slug_unique" },
);
lessonSchema.index(
  { unitId: 1, order: 1 },
  { unique: true, name: "lesson_unit_order_unique" },
);
lessonSchema.index(
  { unitId: 1, status: 1, order: 1 },
  { name: "lesson_unit_status_order" },
);

export const LearningLesson =
  mongoose.models.LearningLesson ??
  mongoose.model<LessonRecord>("LearningLesson", lessonSchema);
