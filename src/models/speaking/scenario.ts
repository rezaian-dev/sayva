import mongoose, { Schema } from "mongoose";

import { contentStatusValues, localizedTextSchema } from "@/models/domain/common";
import type { SpeakingScenarioRecord } from "@/models/speaking/types";

const speakingScenarioSchema = new Schema<SpeakingScenarioRecord>(
  {
    slug: { type: String, required: true, trim: true },
    title: { type: localizedTextSchema, required: true },
    description: { type: localizedTextSchema, required: true },
    instructions: { type: localizedTextSchema, required: true },
    context: { type: localizedTextSchema, required: true },
    role: { type: localizedTextSchema, required: true },
    objective: { type: localizedTextSchema, required: true },
    successCriteria: { type: [localizedTextSchema], required: true, default: [] },
    preparationTips: { type: [localizedTextSchema], required: true, default: [] },
    level: { type: String, trim: true },
    topic: { type: String, trim: true },
    durationLimitSeconds: { type: Number, required: true, min: 15, max: 180 },
    expectedLanguage: { type: String, required: true, trim: true, maxlength: 64 },
    status: { type: String, enum: contentStatusValues, required: true, index: true },
    order: { type: Number, required: true, min: 0 },
  },
  { collection: "speaking_scenarios", timestamps: true, strict: true },
);

speakingScenarioSchema.index({ slug: 1 }, { unique: true });
speakingScenarioSchema.index({ status: 1, order: 1, _id: 1 });

export const SpeakingScenario =
  mongoose.models.SpeakingScenario ??
  mongoose.model<SpeakingScenarioRecord>("SpeakingScenario", speakingScenarioSchema);
