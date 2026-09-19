/**
 * Maps onboarding self-assessment labels to CEFR curriculum slugs.
 *
 * Onboarding stores labels like "beginner"/"intermediate", while the
 * Learning Core identifies levels by CEFR slugs ("a1".."c2"). Comparing
 * them directly always misses, which used to render the learning home
 * page empty even with a fully seeded database.
 */
const ONBOARDING_LEVEL_TO_CEFR_SLUG: Record<string, string> = {
  beginner: "a1",
  elementary: "a2",
  intermediate: "b1",
  "upper-intermediate": "b2",
  advanced: "c1",
};

/**
 * Normalizes any stored learner level (a CEFR slug in any letter case,
 * or an onboarding label) to a lowercase CEFR-style slug.
 * Returns null when nothing usable was stored.
 */
export function normalizeLearnerLevelSlug(
  learnerLevel: string | null | undefined,
): string | null {
  if (!learnerLevel) return null;
  const normalized = learnerLevel.trim().toLowerCase();
  if (!normalized) return null;
  return ONBOARDING_LEVEL_TO_CEFR_SLUG[normalized] ?? normalized;
}
