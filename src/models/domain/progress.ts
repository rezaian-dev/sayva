import mongoose, { Schema } from "mongoose";

import type { LearnerDomainProgressRecord } from "@/models/domain/types";

const learnerDomainProgressSchema = new Schema<LearnerDomainProgressRecord>(
  {
    userId: { type: String, required: true },
    domain: {
      type: String,
      enum: ["vocabulary", "grammar", "listening", "reading"],
      required: true,
    },
    contentId: { type: Schema.Types.ObjectId, required: true },
    state: {
      type: String,
      enum: ["new", "learning", "known", "in_progress", "completed"],
      required: true,
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    collection: "learner_domain_progress",
    timestamps: true,
    strict: true,
  },
);

learnerDomainProgressSchema.index(
  { userId: 1, domain: 1, contentId: 1 },
  { unique: true },
);
learnerDomainProgressSchema.index({ userId: 1, domain: 1, updatedAt: -1 });

export const LearnerDomainProgress =
  mongoose.models.LearnerDomainProgress ??
  mongoose.model<LearnerDomainProgressRecord>(
    "LearnerDomainProgress",
    learnerDomainProgressSchema,
  );
