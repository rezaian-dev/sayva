import type { Transition, Variants } from "motion/react";

/**
 * Motion foundation — the single source for durations, easings and shared
 * variants. Rules:
 *
 * 1. Motion is subtle and short (<= 450ms).
 * 2. Respect reduced motion: pair every usage with `useReducedMotion()`
 *    from "motion/react" and render plain elements when it returns true.
 * 3. Never animate layout-affecting properties on page load for content
 *    that must be read immediately.
 * 4. Server Components stay plain. Motion lives in the small client
 *    islands in `@/components/motion/` — never import motion here into
 *    server-rendered pages.
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
export const revealTransition: Transition = {
  duration: 0.4,
  ease: standardEase,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: revealTransition,
  },
};

/** Opacity-only reveal for lightweight emphasis. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: gentleEase },
  },
};

/**
 * Entrance for imagery: a slow, quiet settle. Runs once, never loops.
 */
export const imageSettle: Variants = {
  hidden: { opacity: 0, scale: 1.015 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: gentleEase },
  },
};

/** Staggered container: children become visible one after another. */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** Controlled press feedback for CTAs — precise, never bouncy. */
export const pressTransition: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 0.55,
};
