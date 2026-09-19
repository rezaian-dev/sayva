import mongoose, { Schema } from "mongoose";

import { contentStatusValues, localizedTextSchema, practiceReferenceFields } from "@/models/domain/common";
import type { GrammarTopicRecord } from "@/models/grammar/types";

const grammarExampleSchema = new Schema(
  {
    sentence: { type: String, required: true, trim: true },
    translation: { type: String, trim: true },
    note: { type: localizedTextSchema },
  },
  { _id: false, strict: true },
);

const grammarMistakeSchema = new Schema(
  {
    mistake: { type: localizedTextSchema, required: true },
    correction: { type: localizedTextSchema, required: true },
  },
  { _id: false, strict: true },
);

const grammarTopicSchema = new Schema<GrammarTopicRecord>(
  {
    slug: { type: String, required: true, trim: true },
    title: { type: localizedTextSchema, required: true },
    level: { type: String, trim: true },
    summary: { type: localizedTextSchema, required: true },
    explanation: { type: localizedTextSchema, required: true },
    examples: { type: [grammarExampleSchema], required: true, default: [] },
    commonMistakes: { type: [grammarMistakeSchema], required: true, default: [] },
    ...practiceReferenceFields,
    order: { type: Number, required: true, min: 0 },
    status: { type: String, enum: contentStatusValues, required: true, default: "draft" },
  },
  { collection: "grammar_topics", timestamps: true, strict: true },
);

grammarTopicSchema.index({ slug: 1 }, { unique: true });
grammarTopicSchema.index({ status: 1, order: 1, _id: 1 });
grammarTopicSchema.index({ level: 1, status: 1, order: 1 });

export const GrammarTopic =
  mongoose.models.GrammarTopic ??
  mongoose.model<GrammarTopicRecord>("GrammarTopic", grammarTopicSchema);
