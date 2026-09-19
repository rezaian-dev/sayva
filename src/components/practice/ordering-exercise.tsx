import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { PublicPracticeExercise } from "@/lib/practice/types";

export function OrderingExercise({
  exercise,
  locale,
  itemIds,
  onMove,
  orderLabel,
  moveUpLabel,
  moveDownLabel,
}: {
  exercise: Extract<PublicPracticeExercise, { exerciseType: "ordering" }>;
  locale: AppLocale;
  itemIds: string[];
  onMove: (index: number, direction: -1 | 1) => void;
  orderLabel: string;
  moveUpLabel: (item: string) => string;
  moveDownLabel: (item: string) => string;
}) {
  const itemsById = new Map(exercise.items.map((item) => [item.id, item]));

  return (
    <ol className="grid gap-3" aria-label={orderLabel}>
      {itemIds.map((itemId, index) => {
        const item = itemsById.get(itemId);
        if (!item) return null;
        return (
          <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold" aria-hidden>
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 text-body-sm">{localize(item.label, locale)}</span>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
                aria-label={moveUpLabel(localize(item.label, locale))}
              >
                <ArrowUp aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === itemIds.length - 1}
                onClick={() => onMove(index, 1)}
                aria-label={moveDownLabel(localize(item.label, locale))}
              >
                <ArrowDown aria-hidden />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
