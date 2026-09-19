"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { updateVocabularyState, type UpdateVocabularyResult } from "@/actions/vocabulary";
import { Button } from "@/components/ui/button";
import type { VocabularyState } from "@/lib/vocabulary/rules";

export function VocabularyStateForm({ itemId, currentState }: { itemId: string; currentState: VocabularyState }) {
  const t = useTranslations("domains.vocabulary.detail");
  const [state, formAction, isPending] = useActionState<UpdateVocabularyResult | null, FormData>(updateVocabularyState, null);
  const effectiveState = state?.ok ? state.state : currentState;

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-body-sm text-muted-foreground">{t("stateLabel")}</p>
      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="itemId" value={itemId} />
        {(["new", "learning", "known"] as const).map((value) => (
          <Button key={value} type="submit" name="state" value={value} variant={effectiveState === value ? "default" : "outline"} disabled={isPending}>
            {t(`states.${value}`)}
          </Button>
        ))}
      </form>
      {state && !state.ok ? (
        <p className="text-body-sm text-destructive" role="alert">{t(`errors.${state.code}`)}</p>
      ) : state?.ok ? (
        <p className="text-body-sm text-success" role="status" aria-live="polite">{t("saved")}</p>
      ) : null}
    </div>
  );
}
