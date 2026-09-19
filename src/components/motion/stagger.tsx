"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Staggered entrance island.
 *
 * `StaggerGroup` reveals its `StaggerItem` children in sequence when the
 * group enters the viewport. Used for hero copy, step lists and card rows.
 *
 * Both components always render `motion.div` on the server and client;
 * reduced motion only swaps animation props (never element shape), so the
 * SSR HTML — which carries the hidden initial state — is always replaced
 * by an identical element that simply skips the animation.
 */
export function StaggerGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      data-motion-reveal
      className={className}
      {...(reduce
        ? {
            initial: false,
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0 },
          }
        : {
            variants: staggerContainer(stagger, delay),
            initial: "hidden",
            whileInView: "visible",
            viewport: { once: true, amount: 0.2, margin: "0px 0px -8% 0px" },
          })}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      data-motion-reveal
      className={cn(className)}
      {...(reduce
        ? {
            initial: false,
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0 },
          }
        : { variants: fadeUp })}
    >
      {children}
    </motion.div>
  );
}
