"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { DomainProgressResult } from "@/lib/domains/types";

type ProgressAction = (
  previous: DomainProgressResult | null,
  formData: FormData,
) => Promise<DomainProgressResult>;

export function ContentProgressForm({
  contentId,
  currentState,
  action,
  namespace,
}: {
  contentId: string;
  currentState: "in_progress" | "completed" | null;
  action: ProgressAction;
  namespace: "grammar" | "listening" | "reading";
}) {
  const t = useTranslations(`domains.${namespace}.detail`);
  const [state, formAction, isPending] = useActionState<DomainProgressResult | null, FormData>(action, null);
  const effectiveState = state?.ok ? state.state : currentState;

  return (
    <div className="flex flex-col items-start gap-3">
      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name={namespace === "grammar" ? "topicId" : "itemId"} value={contentId} />
        <Button type="submit" name="state" value="in_progress" variant="outline" disabled={isPending}>
          {t("markLearning")}
        </Button>
        <Button type="submit" name="state" value="completed" disabled={isPending || effectiveState === "completed"}>
          {isPending ? t("saving") : effectiveState === "completed" ? t("completed") : t("complete")}
        </Button>
      </form>
      {state && !state.ok ? (
        <p className="text-body-sm text-destructive" role="alert">{t(`errors.${state.code}`)}</p>
      ) : state?.ok ? (
        <p className="text-body-sm text-success" role="status" aria-live="polite">{t("saved")}</p>
      ) : null}
    </div>
  );
}
