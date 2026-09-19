import type { LocalizedText } from "@/models/learning/types";

export type ProgressDomain = "vocabulary" | "grammar" | "listening" | "reading";
export type ProgressEvidence = "insufficient" | "developing" | "reliable";

export type LearningProgressSummary = {
  level: { code: string; title: LocalizedText } | null;
  completedLessons: number;
  totalLessons: number;
  currentLesson: {
    id: string;
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    levelSlug: string;
    courseSlug: string;
    unitSlug: string;
  } | null;
};

export type DomainProgressSummary = {
  domain: ProgressDomain;
  availableCount: number;
  startedCount: number;
  inProgressCount: number;
  completedCount: number;
  knownCount: number;
  completionPercent: number | null;
};

export type PracticeProgressSummary = {
  completedSessions: number;
  attempts: number;
  correctAnswers: number;
  accuracy: number | null;
  recentAttempts: number;
  recentCorrectAnswers: number;
  recentAccuracy: number | null;
  evidence: ProgressEvidence;
};

export type SpeakingProgressSummary = {
  completedAttempts: number;
  providerUnavailableAttempts: number;
};

export type ActivityProgressSummary = {
  activeDaysLast30: number;
  activitySignalsLast30: number;
  lastActivityAt: Date | null;
  usesUtcBoundaries: true;
};

export type RecommendationType =
  | "continue-learning"
  | "practice-skill"
  | "review-vocabulary"
  | "complete-grammar"
  | "complete-listening"
  | "complete-reading";

export type Recommendation = {
  type: RecommendationType;
  priority: number;
  reason: "next-lesson" | "recent-practice" | "unfinished-domain" | "review-state" | "practice-history";
  href: string;
  targetTitle?: LocalizedText;
  targetDomain?: ProgressDomain;
};

export type ProgressDashboardData = {
  learning: LearningProgressSummary;
  domains: DomainProgressSummary[];
  practice: PracticeProgressSummary;
  speaking: SpeakingProgressSummary;
  activity: ActivityProgressSummary;
  recommendation: Recommendation | null;
};
