"use client";

import { ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Button, buttonVariants } from "@/components/ui/button";
import { pressTransition } from "@/lib/motion";
import type { VariantProps } from "class-variance-authority";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

/**
 * Marketing CTA — the one client island for primary actions on public
 * pages. Server pages render it like any other element; the island adds
 * the press feedback (subtle scale, controlled spring) and the arrow
 * nudge on hover. With `prefers-reduced-motion` the press transform is
 * disabled and the button keeps its CSS transitions.
 */
export function CtaLink({
  href,
  children,
  locale,
  variant = "default",
  size = "default",
  className,
  icon = true,
}: {
  href: string;
  children: React.ReactNode;
  locale: AppLocale;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  icon?: boolean;
}) {
  const reduce = useReducedMotion();
  const Icon = locale === "fa" ? ArrowUpLeft : ArrowUpRight;

  return (
    <motion.span
      className="inline-flex"
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={pressTransition}
    >
      <Button asChild variant={variant} size={size} className={className}>
        <Link href={href} className="group/cta">
          {children}
          {icon ? (
            <Icon
              aria-hidden
              className="size-4 transition-transform duration-300 ease-out group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 rtl:group-hover/cta:-translate-x-0.5"
            />
          ) : null}
        </Link>
      </Button>
    </motion.span>
  );
}
