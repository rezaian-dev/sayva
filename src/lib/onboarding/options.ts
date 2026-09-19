export const onboardingLevels = [
  "beginner",
  "elementary",
  "intermediate",
  "upper-intermediate",
  "advanced",
] as const;

export const onboardingGoals = [
  "conversation",
  "work",
  "travel",
  "study",
  "confidence",
] as const;

export type OnboardingLevel = (typeof onboardingLevels)[number];
export type OnboardingGoal = (typeof onboardingGoals)[number];
