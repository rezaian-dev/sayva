import { SayvaMark } from "@/components/brand/sayva-mark";
import { cn } from "@/lib/utils";

/**
 * Shared empty state — the brand mark inside a quiet arch ring, a clear
 * message, and an optional useful action. Used by every domain home so
 * "nothing here yet" never reads as a dead end.
 */
export function EmptyState({
  message,
  action,
  className,
}: {
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/70 px-6 py-14 text-center",
        className
      )}
    >
      <span className="relative flex size-16 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-full border border-gold/40" />
        <span aria-hidden className="absolute inset-2 rounded-full border border-gold/20" />
        <SayvaMark className="size-7 text-muted-foreground/70" />
      </span>
      <p className="max-w-sm text-body text-muted-foreground">{message}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
