import type { PublicPracticeExercise } from "@/lib/practice/types";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";

export function MultipleChoiceExercise({
  exercise,
  locale,
  selected,
  onSelect,
}: {
  exercise: Extract<PublicPracticeExercise, { exerciseType: "multiple-choice" }>;
  locale: AppLocale;
  selected: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="sr-only">{localize(exercise.prompt, locale)}</legend>
      {exercise.options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors has-checked:border-primary has-checked:bg-primary/5 hover:bg-muted"
        >
          <input
            type="radio"
            name="practice-option"
            value={option.id}
            checked={selected === option.id}
            onChange={() => onSelect(option.id)}
            className="mt-1 size-4 accent-primary"
          />
          <span className="text-body-sm">{localize(option.label, locale)}</span>
        </label>
      ))}
    </fieldset>
  );
}
