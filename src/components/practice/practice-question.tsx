"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { submitPracticeAnswer } from "@/actions/practice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FillBlankExercise } from "@/components/practice/fill-blank-exercise";
import { MatchingExercise } from "@/components/practice/matching-exercise";
import { MultipleChoiceExercise } from "@/components/practice/multiple-choice-exercise";
import { OrderingExercise } from "@/components/practice/ordering-exercise";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import { practiceResultsPath } from "@/lib/practice/paths";
import type { PracticeResponse } from "@/models/practice/types";
import type { AppLocale } from "@/i18n/routing";
import type { PublicPracticeExercise, SubmitPracticeResult } from "@/lib/practice/types";

export function PracticeQuestion({
  exercise,
  sessionId,
  practiceSetId,
  locale,
  questionNumber,
  totalCount,
}: {
  exercise: PublicPracticeExercise;
  sessionId: string;
  practiceSetId: string;
  locale: AppLocale;
  questionNumber: number;
  totalCount: number;
}) {
  const t = useTranslations("practice.question");
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<SubmitPracticeResult | null, FormData>(
    submitPracticeAnswer,
    null,
  );
  const [response, setResponse] = useState<PracticeResponse | null>(() =>
    exercise.exerciseType === "ordering"
      ? { type: "ordering", itemIds: exercise.items.map((item) => item.id) }
      : null,
  );
  const [fillAnswer, setFillAnswer] = useState("");
  const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>({});
  const [orderedIds, setOrderedIds] = useState(() =>
    exercise.exerciseType === "ordering" ? exercise.items.map((item) => item.id) : [],
  );

  const questionPrompt = localize(exercise.prompt, locale);
  const isResult = Boolean(state?.ok);
  const responseReady =
    response !== null &&
    (exercise.exerciseType !== "matching" || (response?.type === "matching" && response.pairs.length === exercise.leftItems.length)) &&
    (exercise.exerciseType !== "fill-blank" || (response?.type === "fill-blank" && response.answer.trim().length > 0));
  const canSubmit = responseReady && !isPending && !isResult;

  function selectOption(optionId: string) {
    setResponse({ type: "multiple-choice", optionId });
  }

  function updateFillAnswer(answer: string) {
    setFillAnswer(answer);
    setResponse({ type: "fill-blank", answer });
  }

  function updateMatching(leftId: string, rightId: string) {
    const nextPairs = { ...matchingPairs };
    if (rightId) nextPairs[leftId] = rightId;
    else delete nextPairs[leftId];
    setMatchingPairs(nextPairs);
    setResponse({
      type: "matching",
      pairs: Object.entries(nextPairs).map(([pairLeftId, pairRightId]) => ({
        leftId: pairLeftId,
        rightId: pairRightId,
      })),
    });
  }

  function moveOrderedItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setOrderedIds(next);
    setResponse({ type: "ordering", itemIds: next });
  }

  return (
    <Card key={exercise.id} className="overflow-hidden">
      <CardHeader className="border-b border-border/70 bg-card">
        <div className="flex items-center justify-between gap-4 text-label text-muted-foreground">
          <span>{t("progress", { current: questionNumber, total: totalCount })}</span>
          <span>{t(`types.${exercise.exerciseType}`)}</span>
        </div>
        <h2 className="text-h2 mt-4">{questionPrompt}</h2>
        {exercise.instruction ? (
          <p className="text-body-sm text-muted-foreground">{localize(exercise.instruction, locale)}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-6">
        <form action={formAction} className="grid gap-6">
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <input
            type="hidden"
            name="response"
            value={response ? JSON.stringify(response) : ""}
            readOnly
          />

          {exercise.exerciseType === "multiple-choice" ? (
            <MultipleChoiceExercise
              exercise={exercise}
              locale={locale}
              selected={response?.type === "multiple-choice" ? response.optionId : null}
              onSelect={selectOption}
            />
          ) : null}
          {exercise.exerciseType === "fill-blank" ? (
            <FillBlankExercise answer={fillAnswer} onChange={updateFillAnswer} label={t("answerLabel")} />
          ) : null}
          {exercise.exerciseType === "matching" ? (
            <MatchingExercise
              exercise={exercise}
              locale={locale}
              pairs={matchingPairs}
              onChange={updateMatching}
            />
          ) : null}
          {exercise.exerciseType === "ordering" ? (
            <OrderingExercise
              exercise={exercise}
              locale={locale}
              itemIds={orderedIds}
              onMove={moveOrderedItem}
              orderLabel={t("orderItemsLabel")}
              moveUpLabel={(item) => t("moveUp", { item })}
              moveDownLabel={(item) => t("moveDown", { item })}
            />
          ) : null}

          <div className="flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? t("submitting") : t("submit")}
            </Button>
            {state && !state.ok ? (
              <p className="text-body-sm text-destructive" role="alert">
                {t(`errors.${state.code}`)}
              </p>
            ) : null}
          </div>
        </form>

        {state?.ok ? (
          <div
            className="mt-6 rounded-xl border border-border bg-muted/50 p-4"
            role="status"
            aria-live="polite"
          >
            <p className="font-semibold">{state.isCorrect ? t("correct") : t("incorrect")}</p>
            <p className="text-body-sm mt-1 text-muted-foreground">
              {state.isCorrect ? t("correctBody") : t("incorrectBody")}
            </p>
            {state.completed ? (
              <Button asChild className="mt-4" autoFocus>
                <Link href={practiceResultsPath(practiceSetId)}>{t("viewResult")}</Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" className="mt-4" autoFocus onClick={() => router.refresh()}>
                {t("next")}
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
