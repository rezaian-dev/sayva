import mongoose, { Schema } from "mongoose";

import { contentStatusValues, localizedTextSchema, practiceReferenceFields } from "@/models/domain/common";
import type { ReadingItemRecord } from "@/models/reading/types";

const readingSectionSchema = new Schema(
  {
    heading: { type: localizedTextSchema },
    paragraphs: { type: [localizedTextSchema], required: true, validate: (items: unknown[]) => items.length > 0 },
  },
  { _id: false, strict: true },
);

const readingItemSchema = new Schema<ReadingItemRecord>(
  {
    slug: { type: String, required: true, trim: true },
    title: { type: localizedTextSchema, required: true },
    summary: { type: localizedTextSchema, required: true },
    level: { type: String, trim: true },
    sections: { type: [readingSectionSchema], required: true, validate: (items: unknown[]) => items.length > 0 },
    estimatedDuration: { type: Number, min: 1 },
    ...practiceReferenceFields,
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: contentStatusValues, required: true, default: "draft" },
  },
  { collection: "reading_items", timestamps: true, strict: true },
);

readingItemSchema.index({ slug: 1 }, { unique: true });
readingItemSchema.index({ status: 1, order: 1, _id: 1 });
readingItemSchema.index({ level: 1, status: 1, order: 1 });

export const ReadingItem =
  mongoose.models.ReadingItem ??
  mongoose.model<ReadingItemRecord>("ReadingItem", readingItemSchema);
