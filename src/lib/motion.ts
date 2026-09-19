import type { Transition, Variants } from "motion/react";

/**
 * Motion foundation — the single source for durations, easings and shared
 * variants. Rules:
 *
 * 1. Motion is subtle and short (<= 450ms).
 * 2. Respect reduced motion: pair every usage with `useReducedMotion()`
 *    from "motion/react" and skip the animation when it returns true.
 * 3. Never animate layout-affecting properties on page load for content
 *    that must be read immediately.
 */

export const durations = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
} as const;

export const standardEase: [number, number, number, number] = [0.2, 0, 0, 1];
export const gentleEase: [number, number, number, number] = [0.3, 0, 0.2, 1];

export const baseTransition: Transition = {
  duration: durations.base,
  ease: standardEase,
};

/** Small upward reveal for sections that enter the viewport. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

/** Opacity-only reveal for lightweight emphasis. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.fast, ease: gentleEase },
  },
};
