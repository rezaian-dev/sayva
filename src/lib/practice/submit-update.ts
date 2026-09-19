import { calculateScore, isPracticeComplete } from "@/lib/practice/score";

/**
 * Builds the single atomic MongoDB update that appends a practice attempt
 * and derives the session lifecycle/result from the post-append counts.
 *
 * Plain `$push`/`$set` operators on purpose: Mongoose rejects
 * aggregation-pipeline (array-form) updates with "Cannot pass an array to
 * query updates...". The caller keeps the
 * `"attempts.exerciseId": { $ne: exerciseId }` filter guard, so a
 * concurrent duplicate submit matches nothing and falls back to a re-read.
 */
export function buildAttemptAppendUpdate<TAttempt extends { isCorrect: boolean }>(args: {
  previousAttempts: readonly { isCorrect: boolean }[];
  attempt: TAttempt;
  totalCount: number;
  submittedAt: Date;
}): {
  update: {
    $push: { attempts: TAttempt };
    $set: {
      currentIndex: number;
      status: "active" | "completed";
      completedAt?: Date;
      result?: {
        correctCount: number;
        totalCount: number;
        scorePercent: number;
        completedAt: Date;
      };
    };
  };
  answeredCount: number;
  correctCount: number;
  completed: boolean;
} {
  const { previousAttempts, attempt, totalCount, submittedAt } = args;
  const answeredCount = previousAttempts.length + 1;
  const correctCount =
    previousAttempts.reduce((count, previous) => count + (previous.isCorrect ? 1 : 0), 0) +
    (attempt.isCorrect ? 1 : 0);
  const completed = isPracticeComplete(answeredCount, totalCount);

  return {
    update: {
      $push: { attempts: attempt },
      $set: {
        currentIndex: answeredCount,
        status: completed ? "completed" : "active",
        ...(completed
          ? {
              completedAt: submittedAt,
              result: {
                correctCount,
                totalCount,
                scorePercent: calculateScore(correctCount, totalCount),
                completedAt: submittedAt,
              },
            }
          : {}),
      },
    },
    answeredCount,
    correctCount,
    completed,
  };
}
