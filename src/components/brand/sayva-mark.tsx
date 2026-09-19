import { cn } from "@/lib/utils";

/**
 * The SAYVA brand mark.
 *
 * A single geometric arch — the iwan, the archway that gives Iranian
 * architecture its quiet identity — with a point of light inside: the voice.
 * One continuous stroke plus one dot, so it stays legible at 16px favicon
 * size and works in a single color (pass `mono`).
 *
 * The arch strokes follow `currentColor`; the voice point is brand gold by
 * default. Use `className="text-..."` to recolor.
 */
export function SayvaMark({
  className,
  mono = false,
}: {
  className?: string;
  mono?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={cn("block", className)}
    >
      <path
        d="M11 40V21a13 13 0 0 1 26 0v19"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="27.5" r="4.75" fill={mono ? "currentColor" : "var(--gold)"} />
    </svg>
  );
}
