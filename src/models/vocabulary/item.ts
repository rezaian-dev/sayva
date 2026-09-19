import mongoose, { Schema } from "mongoose";

import { contentStatusValues, localizedTextSchema, practiceReferenceFields } from "@/models/domain/common";
import type { VocabularyItemRecord } from "@/models/vocabulary/types";

const exampleSchema = new Schema(
  {
    sentence: { type: String, required: true, trim: true },
    translation: { type: String, trim: true },
  },
  { _id: false, strict: true },
);

const pronunciationSchema = new Schema(
  {
    ipa: { type: String, trim: true },
    audioSrc: { type: String, match: /^\/audio\//, trim: true },
  },
  { _id: false, strict: true },
);

const vocabularyItemSchema = new Schema<VocabularyItemRecord>(
  {
    slug: { type: String, required: true, trim: true },
    word: { type: String, required: true, trim: true },
    normalizedWord: { type: String, required: true, trim: true },
    partOfSpeech: { type: String, trim: true },
    definition: { type: localizedTextSchema, required: true },
    translation: { type: localizedTextSchema, required: true },
    examples: { type: [exampleSchema], required: true, default: [] },
    pronunciation: { type: pronunciationSchema },
    level: { type: String, trim: true },
    ...practiceReferenceFields,
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: contentStatusValues, required: true, default: "draft" },
  },
  { collection: "vocabulary_items", timestamps: true, strict: true },
);

vocabularyItemSchema.index({ slug: 1 }, { unique: true });
vocabularyItemSchema.index({ status: 1, order: 1, _id: 1 });
vocabularyItemSchema.index({ normalizedWord: 1, partOfSpeech: 1 });

export const VocabularyItem =
  mongoose.models.VocabularyItem ??
  mongoose.model<VocabularyItemRecord>("VocabularyItem", vocabularyItemSchema);
