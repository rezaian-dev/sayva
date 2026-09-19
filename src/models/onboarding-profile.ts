import mongoose, { Schema } from "mongoose";

import {
  onboardingGoals,
  onboardingLevels,
  type OnboardingGoal,
  type OnboardingLevel,
} from "@/lib/onboarding/options";

export { onboardingGoals, onboardingLevels } from "@/lib/onboarding/options";
export type { OnboardingGoal, OnboardingLevel } from "@/lib/onboarding/options";

export type OnboardingProfileRecord = {
  userId: string;
  level: OnboardingLevel;
  goal: OnboardingGoal;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const onboardingProfileSchema = new Schema<OnboardingProfileRecord>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    level: { type: String, enum: onboardingLevels, required: true },
    goal: { type: String, enum: onboardingGoals, required: true },
    completedAt: { type: Date, required: true },
  },
  {
    collection: "sayva_onboarding_profiles",
    timestamps: true,
  },
);

export const OnboardingProfile =
  mongoose.models.OnboardingProfile ??
  mongoose.model<OnboardingProfileRecord>(
    "OnboardingProfile",
    onboardingProfileSchema,
  );
