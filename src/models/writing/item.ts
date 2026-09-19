import mongoose, { Schema } from "mongoose";

import { contentStatusValues, localizedTextSchema, practiceReferenceFields } from "@/models/domain/common";
import type { WritingItemRecord } from "@/models/writing/types";

const writingItemSchema = new Schema<WritingItemRecord>(
  {
    slug: { type: String, required: true, trim: true },
    title: { type: localizedTextSchema, required: true },
    prompt: { type: localizedTextSchema, required: true },
    level: { type: String, trim: true },
    topic: { type: String, trim: true },
    taskType: { type: String, trim: true },
    instructions: { type: localizedTextSchema, required: true },
    audience: { type: String, trim: true },
    purpose: { type: String, trim: true },
    register: { type: String, trim: true },
    recommendedLength: { type: String, trim: true },
    targetLanguage: { type: String, required: true, trim: true, default: "en" },
    targetLanguageFeatures: { type: [String], required: true, default: [] },
    evaluationCriteria: { type: [localizedTextSchema], required: true, default: [] },
    ...practiceReferenceFields,
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: contentStatusValues, required: true, default: "draft" },
  },
  { collection: "writing_items", timestamps: true, strict: true },
);

writingItemSchema.index({ slug: 1 }, { unique: true });
writingItemSchema.index({ status: 1, order: 1, _id: 1 });
writingItemSchema.index({ level: 1, status: 1, order: 1 });

export const WritingItem =
  mongoose.models.WritingItem ??
  mongoose.model<WritingItemRecord>("WritingItem", writingItemSchema);
