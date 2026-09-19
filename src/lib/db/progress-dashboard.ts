import { connectToDatabase } from "@/lib/db/mongodb";
import { getLearningHomeData } from "@/lib/db/learning";
import { LearnerDomainProgress } from "@/models/domain/progress";
import { GrammarTopic } from "@/models/grammar/topic";
import { LessonProgress } from "@/models/learning/progress";
import { ListeningItem } from "@/models/listening/item";
import { PracticeSession } from "@/models/practice/session";
import { ReadingItem } from "@/models/reading/item";
import { SpeakingAttempt } from "@/models/speaking/attempt";
import { VocabularyItem } from "@/models/vocabulary/item";
import type { DomainProgressState } from "@/models/domain/types";
import type { PracticeSessionRecord } from "@/models/practice/types";
import { derivePracticeSummary, deriveRecommendation, type PracticeAttemptSignal } from "@/lib/progress/rules";
import type { DomainProgressSummary, ProgressDashboardData, ProgressDomain } from "@/lib/progress/types";

const published = { status: "published" as const };
const recentPracticeSessionLimit = 50;
const recentActivityLimit = 500;

type StateCount = { _id: DomainProgressState; count: number };
type AggregateCounts = { _id: null; completedSessions: number; attempts: number; correctAnswers: number };
const domainSources: Array<{ domain: ProgressDomain; collection: string; model: typeof VocabularyItem | typeof GrammarTopic | typeof ListeningItem | typeof ReadingItem }> = [
  { domain: "vocabulary", collection: "vocabulary_items", model: VocabularyItem },
  { domain: "grammar", collection: "grammar_topics", model: GrammarTopic },
  { domain: "listening", collection: "listening_items", model: ListeningItem },
  { domain: "reading", collection: "reading_items", model: ReadingItem },
];

async function getDomainSummary(source: (typeof domainSources)[number], userId: string): Promise<DomainProgressSummary> {
  const [availableResult, stateCounts] = await Promise.all([
    source.model.countDocuments(published).exec(),
    LearnerDomainProgress.aggregate<StateCount>([
      { $match: { userId, domain: source.domain } },
      {
        $lookup: {
          from: source.collection,
          localField: "contentId",
          foreignField: "_id",
          as: "publishedContent",
          pipeline: [{ $match: published }, { $project: { _id: 1 } }],
        },
      },
      { $match: { "publishedContent.0": { $exists: true } } },
      { $group: { _id: "$state", count: { $sum: 1 } } },
    ]).exec(),
  ]);
  const counts = new Map(stateCounts.map((item) => [item._id, item.count]));
  const knownCount = counts.get("known") ?? 0;
  const inProgressCount = source.domain === "vocabulary" ? counts.get("learning") ?? 0 : counts.get("in_progress") ?? 0;
  const completedCount = source.domain === "vocabulary" ? knownCount : counts.get("completed") ?? 0;
  const startedCount = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);

  return {
    domain: source.domain,
    availableCount: availableResult,
    startedCount,
    inProgressCount,
    completedCount,
    knownCount,
    completionPercent: source.domain === "vocabulary" ? null : availableResult ? Math.round((completedCount / availableResult) * 100) : null,
  };
}

async function getPracticeSummarySource(userId: string) {
  const [aggregate, sessions] = await Promise.all([
    PracticeSession.aggregate<AggregateCounts>([
      { $match: { userId, status: "completed", "result.totalCount": { $gt: 0 } } },
      {
        $group: {
          _id: null,
          completedSessions: { $sum: 1 },
          attempts: { $sum: "$result.totalCount" },
          correctAnswers: { $sum: "$result.correctCount" },
        },
      },
    ]).exec(),
    PracticeSession.find({ userId, status: "completed" })
      .sort({ completedAt: -1, _id: -1 })
      .limit(recentPracticeSessionLimit)
      .select({ attempts: 1 })
      .lean<Pick<PracticeSessionRecord, "attempts">[]>()
      .exec(),
  ]);
  const counts = aggregate[0] ?? { completedSessions: 0, attempts: 0, correctAnswers: 0 };
  const recentAttemptSignals: PracticeAttemptSignal[] = sessions.flatMap((session) =>
    session.attempts.map((attempt) => ({ isCorrect: attempt.isCorrect, submittedAt: attempt.submittedAt })),
  );
  return { ...counts, recentAttemptSignals };
}

async function getActivitySource(userId: string, now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
  const [lessons, practice, domains, speaking] = await Promise.all([
    LessonProgress.find({ userId, status: "completed", completedAt: { $gte: start } })
      .sort({ completedAt: -1 }).limit(recentActivityLimit).select({ completedAt: 1 }).lean<Array<{ completedAt: Date }>>().exec(),
    PracticeSession.find({ userId, status: "completed", completedAt: { $gte: start } })
      .sort({ completedAt: -1 }).limit(recentActivityLimit).select({ completedAt: 1 }).lean<Array<{ completedAt: Date }>>().exec(),
    LearnerDomainProgress.find({ userId, updatedAt: { $gte: start } })
      .sort({ updatedAt: -1 }).limit(recentActivityLimit).select({ updatedAt: 1 }).lean<Array<{ updatedAt: Date }>>().exec(),
    SpeakingAttempt.find({ userId, status: "completed", completedAt: { $gte: start } })
      .sort({ completedAt: -1 }).limit(recentActivityLimit).select({ completedAt: 1 }).lean<Array<{ completedAt: Date }>>().exec(),
  ]);
  const dates = [
    ...lessons.map((item) => item.completedAt),
    ...practice.map((item) => item.completedAt),
    ...domains.map((item) => item.updatedAt),
    ...speaking.map((item) => item.completedAt),
  ].filter((value): value is Date => value instanceof Date);
  return {
    dates,
    lastActivityAt: dates.sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
  };
}

async function getSpeakingSummary(userId: string) {
  const [completedAttempts, providerUnavailableAttempts] = await Promise.all([
    SpeakingAttempt.countDocuments({ userId, status: "completed", transcript: { $type: "string", $ne: "" }, feedback: { $exists: true } }).exec(),
    SpeakingAttempt.countDocuments({ userId, failureCode: "AI_PROVIDER_NOT_CONFIGURED" }).exec(),
  ]);
  return { completedAttempts, providerUnavailableAttempts };
}

export async function getProgressDashboardData(userId: string, learnerLevel: string, now = new Date()): Promise<ProgressDashboardData> {
  await connectToDatabase();
  const [learningHome, domains, practiceSource, activitySource, speaking] = await Promise.all([
    getLearningHomeData(userId, learnerLevel),
    Promise.all(domainSources.map((source) => getDomainSummary(source, userId))),
    getPracticeSummarySource(userId),
    getActivitySource(userId, now),
    getSpeakingSummary(userId),
  ]);
  const learning = {
    level: learningHome.currentLevel ? { code: learningHome.currentLevel.code, title: learningHome.currentLevel.title } : null,
    completedLessons: learningHome.completedLessons,
    totalLessons: learningHome.totalLessons,
    currentLesson: learningHome.currentLesson ? {
      id: learningHome.currentLesson.id,
      slug: learningHome.currentLesson.slug,
      title: learningHome.currentLesson.title,
      description: learningHome.currentLesson.description,
      levelSlug: learningHome.currentLesson.levelSlug,
      courseSlug: learningHome.currentLesson.courseSlug,
      unitSlug: learningHome.currentLesson.unitSlug,
    } : null,
  };
  const practice = derivePracticeSummary({ ...practiceSource, now });
  const recommendation = deriveRecommendation({ learning, domains, practice });
  const activityDates = new Set(activitySource.dates.map((date) => `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`));
  return {
    learning,
    domains,
    practice,
    speaking,
    activity: {
      activeDaysLast30: activityDates.size,
      activitySignalsLast30: activitySource.dates.length,
      lastActivityAt: activitySource.lastActivityAt,
      usesUtcBoundaries: true,
    },
    recommendation,
  };
}
