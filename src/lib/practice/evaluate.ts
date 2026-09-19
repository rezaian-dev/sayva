import type {
  FillBlankExerciseRecord,
  MatchingExerciseRecord,
  MultipleChoiceExerciseRecord,
  OrderingExerciseRecord,
  PracticeExerciseRecord,
  PracticeResponse,
} from "@/models/practice/types";

import { normalizeAnswer, sameStringSet } from "@/lib/practice/normalize";

export type EvaluationResult = {
  isCorrect: boolean;
  normalizedResponse: PracticeResponse;
};

function invalidResponse(response: PracticeResponse): EvaluationResult {
  return { isCorrect: false, normalizedResponse: response };
}

function evaluateMultipleChoice(
  exercise: MultipleChoiceExerciseRecord,
  response: Extract<PracticeResponse, { type: "multiple-choice" }>,
): EvaluationResult {
  if (!exercise.options.some((option) => option.id === response.optionId)) {
    return invalidResponse(response);
  }

  return {
    isCorrect: response.optionId === exercise.correctOptionId,
    normalizedResponse: response,
  };
}

function evaluateFillBlank(
  exercise: FillBlankExerciseRecord,
  response: Extract<PracticeResponse, { type: "fill-blank" }>,
): EvaluationResult {
  const normalizedAnswer = normalizeAnswer(response.answer, exercise.caseSensitive);
  const acceptedAnswers = exercise.acceptedAnswers.map((answer) =>
    normalizeAnswer(answer, exercise.caseSensitive),
  );

  return {
    isCorrect: acceptedAnswers.includes(normalizedAnswer),
    normalizedResponse: { type: "fill-blank", answer: normalizedAnswer },
  };
}

function evaluateMatching(
  exercise: MatchingExerciseRecord,
  response: Extract<PracticeResponse, { type: "matching" }>,
): EvaluationResult {
  const leftIds = new Set(exercise.leftItems.map((item) => item.id));
  const rightIds = new Set(exercise.rightItems.map((item) => item.id));
  const valid = response.pairs.every(
    (pair) => leftIds.has(pair.leftId) && rightIds.has(pair.rightId),
  );
  const expected = exercise.pairs.map((pair) => `${pair.leftId}:${pair.rightId}`);
  const actual = response.pairs.map((pair) => `${pair.leftId}:${pair.rightId}`);

  if (!valid || !sameStringSet(actual, expected)) return invalidResponse(response);

  return { isCorrect: true, normalizedResponse: response };
}

function evaluateOrdering(
  exercise: OrderingExerciseRecord,
  response: Extract<PracticeResponse, { type: "ordering" }>,
): EvaluationResult {
  const itemIds = exercise.items.map((item) => item.id);
  const valid = sameStringSet(response.itemIds, itemIds);

  return {
    isCorrect: valid && response.itemIds.every((id, index) => id === exercise.correctOrder[index]),
    normalizedResponse: response,
  };
}

export function evaluatePracticeResponse(
  exercise: PracticeExerciseRecord,
  response: PracticeResponse,
): EvaluationResult {
  if (exercise.exerciseType !== response.type) return invalidResponse(response);

  switch (exercise.exerciseType) {
    case "multiple-choice":
      return response.type === "multiple-choice"
        ? evaluateMultipleChoice(exercise, response)
        : invalidResponse(response);
    case "fill-blank":
      return response.type === "fill-blank"
        ? evaluateFillBlank(exercise, response)
        : invalidResponse(response);
    case "matching":
      return response.type === "matching"
        ? evaluateMatching(exercise, response)
        : invalidResponse(response);
    case "ordering":
      return response.type === "ordering"
        ? evaluateOrdering(exercise, response)
        : invalidResponse(response);
  }
}
