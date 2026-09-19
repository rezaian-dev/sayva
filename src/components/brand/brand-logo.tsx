import { cn } from "@/lib/utils";
import { SayvaMark } from "@/components/brand/sayva-mark";

/**
 * Primary logo lockup: mark + wordmark.
 * The wordmark is set in the Latin brand face with wide tracking; the mark
 * carries the identity. Color follows the surrounding text color, so the
 * same lockup works on cream, navy and dark surfaces.
 */
export function BrandLogo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <SayvaMark className={cn("size-8 text-foreground", markClassName)} />
      <span
        lang="en"
        dir="ltr"
        className={cn(
          "font-en text-sm font-extrabold tracking-[0.3em] me-[-0.3em] text-foreground",
          wordClassName
        )}
      >
        SAYVA
      </span>
    </span>
  );
}
