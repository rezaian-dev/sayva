import { Label } from "@/components/ui/label";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { PublicPracticeExercise } from "@/lib/practice/types";

export function MatchingExercise({
  exercise,
  locale,
  pairs,
  onChange,
}: {
  exercise: Extract<PublicPracticeExercise, { exerciseType: "matching" }>;
  locale: AppLocale;
  pairs: Record<string, string>;
  onChange: (leftId: string, rightId: string) => void;
}) {
  return (
    <div className="grid gap-4">
      {exercise.leftItems.map((leftItem) => (
        <div key={leftItem.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-4">
          <Label htmlFor={`match-${leftItem.id}`} className="rounded-lg bg-muted px-3 py-2 text-body-sm">
            {localize(leftItem.label, locale)}
          </Label>
          <select
            id={`match-${leftItem.id}`}
            value={pairs[leftItem.id] ?? ""}
            onChange={(event) => onChange(leftItem.id, event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">—</option>
            {exercise.rightItems.map((rightItem) => (
              <option key={rightItem.id} value={rightItem.id}>
                {localize(rightItem.label, locale)}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
