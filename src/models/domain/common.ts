import { Schema } from "mongoose";

export const contentStatusValues = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof contentStatusValues)[number];

export const localizedTextSchema = new Schema(
  {
    fa: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false, strict: true },
);

export const practiceReferenceFields = {
  lessonId: { type: Schema.Types.ObjectId, ref: "LearningLesson" },
  practiceSetId: { type: Schema.Types.ObjectId, ref: "PracticeSet" },
};
