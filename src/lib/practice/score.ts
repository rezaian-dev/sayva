export function calculateScore(correctCount: number, totalCount: number) {
  if (totalCount <= 0 || correctCount < 0 || correctCount > totalCount) return 0;
  return Math.round((correctCount / totalCount) * 100);
}

export function isPracticeComplete(answeredCount: number, totalCount: number) {
  return totalCount > 0 && answeredCount >= totalCount;
}
