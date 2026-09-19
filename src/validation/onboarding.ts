import { z } from "zod";

import { onboardingGoals, onboardingLevels } from "@/lib/onboarding/options";

export const onboardingSchema = z.object({
  level: z.enum(onboardingLevels),
  goal: z.enum(onboardingGoals),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
