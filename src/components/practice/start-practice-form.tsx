"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { startPracticeSession, type StartPracticeResult } from "@/actions/practice";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";

export function StartPracticeForm({
  practiceSetId,
  locale,
}: {
  practiceSetId: string;
  locale: AppLocale;
}) {
  const t = useTranslations("practice");
  const [state, formAction, isPending] = useActionState<StartPracticeResult | null, FormData>(
    startPracticeSession,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="practiceSetId" value={practiceSetId} />
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? t("actions.starting") : t("actions.start")}
      </Button>
      {state && !state.ok ? (
        <p className="text-body-sm text-destructive" role="alert">
          {t(`errors.${state.code}`)}
        </p>
      ) : null}
    </form>
  );
}
