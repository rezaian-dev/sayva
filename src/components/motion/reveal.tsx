"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { fadeUp, revealTransition } from "@/lib/motion";

/**
 * Scroll reveal island — the only motion wrapper for page content.
 *
 * Wraps children in a `whileInView` fade-up that runs once per element.
 *
 * Hydration-safe by construction: the server always renders the
 * `motion.div` (with the hidden initial state baked into the HTML), and
 * reduced-motion users never get a different element — they get the same
 * `motion.div` with `initial={false}`, so the first client render matches
 * the server tree exactly and the content simply appears without motion.
 * Branching to a plain div here would be a shape mismatch that strands
 * the SSR `opacity: 0` state.
 *
 * A `<noscript>` style in the layout guarantees visibility when no
 * JavaScript runs at all.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      data-motion-reveal
      className={className}
      {...(reduce
        ? {
            // Same element shape as the SSR'd motion.div, but explicitly
            // driven to the visible state instantly. Motion does not clear
            // the SSR-baked hidden style on its own, so the visible target
            // must be stated — with a zero-duration transition so reduced
            // motion means zero motion.
            initial: false,
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0 },
          }
        : {
            variants: fadeUp,
            initial: "hidden",
            whileInView: "visible",
            viewport: { once: true, amount: 0.25, margin: "0px 0px -8% 0px" },
            transition: { ...revealTransition, delay },
          })}
    >
      {children}
    </motion.div>
  );
}
