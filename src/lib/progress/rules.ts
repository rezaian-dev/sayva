import type { DomainProgressSummary, LearningProgressSummary, PracticeProgressSummary, ProgressDomain, ProgressEvidence, Recommendation } from "@/lib/progress/types";

const RECENT_WINDOW_DAYS = 14;
const EVIDENCE_DEVELOPING_MIN = 5;
const EVIDENCE_RELIABLE_MIN = 10;

export type PracticeAttemptSignal = { isCorrect: boolean; submittedAt: Date };

export function calculatePercent(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

export function derivePracticeSummary({
  completedSessions,
  attempts,
  correctAnswers,
  recentAttemptSignals,
  now,
}: {
  completedSessions: number;
  attempts: number;
  correctAnswers: number;
  recentAttemptSignals: PracticeAttemptSignal[];
  now: Date;
}): PracticeProgressSummary {
  const recentCutoff = new Date(now.getTime() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recent = recentAttemptSignals.filter((attempt) => attempt.submittedAt >= recentCutoff);
  const recentCorrectAnswers = recent.filter((attempt) => attempt.isCorrect).length;
  const evidence: ProgressEvidence = recent.length >= EVIDENCE_RELIABLE_MIN
    ? "reliable"
    : recent.length >= EVIDENCE_DEVELOPING_MIN
      ? "developing"
      : "insufficient";

  return {
    completedSessions,
    attempts,
    correctAnswers,
    accuracy: attempts >= EVIDENCE_DEVELOPING_MIN ? calculatePercent(correctAnswers, attempts) : null,
    recentAttempts: recent.length,
    recentCorrectAnswers,
    recentAccuracy: evidence === "insufficient" ? null : calculatePercent(recentCorrectAnswers, recent.length),
    evidence,
  };
}

export function deriveRecommendation({
  learning,
  domains,
  practice,
}: {
  learning: LearningProgressSummary;
  domains: DomainProgressSummary[];
  practice: PracticeProgressSummary;
}): Recommendation | null {
  if (learning.currentLesson) {
    return {
      type: "continue-learning",
      priority: 100,
      reason: "next-lesson",
      href: `/learn/${learning.currentLesson.levelSlug}/${learning.currentLesson.courseSlug}/${learning.currentLesson.unitSlug}/${learning.currentLesson.slug}`,
      targetTitle: learning.currentLesson.title,
    };
  }

  if (practice.evidence !== "insufficient" && practice.recentAccuracy !== null && practice.recentAccuracy < 60) {
    return {
      type: "practice-skill",
      priority: 80,
      reason: "recent-practice",
      href: "/practice",
    };
  }

  const unfinishedDomainOrder: ProgressDomain[] = ["grammar", "listening", "reading"];
  for (const domain of unfinishedDomainOrder) {
    const summary = domains.find((item) => item.domain === domain);
    if (summary && summary.availableCount > 0 && summary.inProgressCount > 0 && summary.completedCount < summary.availableCount) {
      return {
        type: domain === "grammar" ? "complete-grammar" : domain === "listening" ? "complete-listening" : "complete-reading",
        priority: 60,
        reason: "unfinished-domain",
        href: `/${domain}`,
        targetDomain: domain,
      };
    }
  }

  const vocabulary = domains.find((item) => item.domain === "vocabulary");
  if (vocabulary && vocabulary.inProgressCount > 0) {
    return {
      type: "review-vocabulary",
      priority: 50,
      reason: "review-state",
      href: "/vocabulary",
      targetDomain: "vocabulary",
    };
  }

  if (practice.completedSessions > 0) {
    return {
      type: "practice-skill",
      priority: 40,
      reason: "practice-history",
      href: "/practice",
    };
  }

  return null;
}
