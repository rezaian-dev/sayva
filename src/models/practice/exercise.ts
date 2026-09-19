import mongoose, { Schema } from "mongoose";

import type {
  FillBlankExerciseRecord,
  MatchingExerciseRecord,
  MultipleChoiceExerciseRecord,
  OrderingExerciseRecord,
  PracticeExerciseRecord,
} from "@/models/practice/types";

const localizedTextSchema = new Schema(
  {
    fa: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

const baseExerciseSchema = new Schema<PracticeExerciseRecord>(
  {
    practiceSetId: { type: Schema.Types.ObjectId, ref: "PracticeSet", required: true },
    prompt: { type: localizedTextSchema, required: true },
    instruction: { type: localizedTextSchema },
    order: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      required: true,
      default: "draft",
    },
  },
  {
    collection: "practice_exercises",
    discriminatorKey: "exerciseType",
    timestamps: true,
    strict: true,
  },
);

baseExerciseSchema.index({ practiceSetId: 1, status: 1, order: 1 });
baseExerciseSchema.index({ practiceSetId: 1, order: 1 }, { unique: true });

const choiceOptionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: localizedTextSchema, required: true },
  },
  { _id: false, strict: true },
);

const matchingItemSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: localizedTextSchema, required: true },
  },
  { _id: false, strict: true },
);

const matchingPairSchema = new Schema(
  {
    leftId: { type: String, required: true, trim: true },
    rightId: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

const multipleChoiceSchema = new Schema<
  Omit<MultipleChoiceExerciseRecord, keyof PracticeExerciseRecord>
>(
  {
    options: { type: [choiceOptionSchema], required: true, validate: (items: unknown[]) => items.length >= 2 },
    correctOptionId: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

const fillBlankSchema = new Schema<
  Omit<FillBlankExerciseRecord, keyof PracticeExerciseRecord>
>(
  {
    acceptedAnswers: { type: [String], required: true, validate: (items: unknown[]) => items.length > 0 },
    caseSensitive: { type: Boolean, required: true, default: false },
  },
  { _id: false, strict: true },
);

const matchingSchema = new Schema<
  Omit<MatchingExerciseRecord, keyof PracticeExerciseRecord>
>(
  {
    leftItems: { type: [matchingItemSchema], required: true, validate: (items: unknown[]) => items.length > 0 },
    rightItems: { type: [matchingItemSchema], required: true, validate: (items: unknown[]) => items.length > 0 },
    pairs: { type: [matchingPairSchema], required: true, validate: (items: unknown[]) => items.length > 0 },
  },
  { _id: false, strict: true },
);

const orderingSchema = new Schema<
  Omit<OrderingExerciseRecord, keyof PracticeExerciseRecord>
>(
  {
    items: { type: [matchingItemSchema], required: true, validate: (items: unknown[]) => items.length > 1 },
    correctOrder: { type: [String], required: true, validate: (items: unknown[]) => items.length > 1 },
  },
  { _id: false, strict: true },
);

export const PracticeExercise =
  mongoose.models.PracticeExercise ??
  mongoose.model<PracticeExerciseRecord>("PracticeExercise", baseExerciseSchema);

export const MultipleChoiceExercise =
  PracticeExercise.discriminators?.MultipleChoiceExercise ??
  PracticeExercise.discriminator<MultipleChoiceExerciseRecord>(
    "MultipleChoiceExercise",
    multipleChoiceSchema,
    "multiple-choice",
  );

export const FillBlankExercise =
  PracticeExercise.discriminators?.FillBlankExercise ??
  PracticeExercise.discriminator<FillBlankExerciseRecord>(
    "FillBlankExercise",
    fillBlankSchema,
    "fill-blank",
  );

export const MatchingExercise =
  PracticeExercise.discriminators?.MatchingExercise ??
  PracticeExercise.discriminator<MatchingExerciseRecord>(
    "MatchingExercise",
    matchingSchema,
    "matching",
  );

export const OrderingExercise =
  PracticeExercise.discriminators?.OrderingExercise ??
  PracticeExercise.discriminator<OrderingExerciseRecord>(
    "OrderingExercise",
    orderingSchema,
    "ordering",
  );
