"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  completeLesson,
  type CompleteLessonResult,
} from "@/actions/learning";
import { Button } from "@/components/ui/button";

const initialState: CompleteLessonResult | null = null;

export function LessonCompletionForm({
  lessonId,
  completed,
}: {
  lessonId: string;
  completed: boolean;
}) {
  const t = useTranslations("learn.lesson");
  const [state, formAction, isPending] = useActionState(
    completeLesson,
    initialState,
  );
  const isCompleted = completed || state?.ok === true;

  return (
    <div className="flex flex-col items-start gap-3">
      <form action={formAction}>
        <input type="hidden" name="lessonId" value={lessonId} />
        <Button
          type="submit"
          size="lg"
          disabled={isCompleted || isPending}
          aria-busy={isPending}
        >
          {isPending
            ? t("completing")
            : isCompleted
              ? t("completed")
              : t("complete")}
        </Button>
      </form>
      {state && !state.ok ? (
        <p className="text-body-sm text-destructive" role="alert">
          {state.code === "UNAUTHORIZED"
            ? t("errors.unauthorized")
            : state.code === "NOT_FOUND"
              ? t("errors.notFound")
              : state.code === "INVALID"
                ? t("errors.invalid")
                : t("errors.database")}
        </p>
      ) : null}
    </div>
  );
}
