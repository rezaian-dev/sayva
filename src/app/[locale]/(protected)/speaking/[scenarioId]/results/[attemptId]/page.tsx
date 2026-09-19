import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { SpeakingResult } from "@/components/speaking/speaking-result";
import { findOwnedSpeakingAttempt, getPublishedSpeakingScenario } from "@/lib/db/speaking";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";
import type { SpeakingResultView } from "@/lib/speaking/types";

export default async function SpeakingResultPage({ params }: { params: Promise<{ locale: string; scenarioId: string; attemptId: string }> }) {
  const { locale: rawLocale, scenarioId, attemptId } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const scenario = await getPublishedSpeakingScenario(scenarioId);
  const attempt = await findOwnedSpeakingAttempt(session.user.id, scenarioId, attemptId);
  if (!scenario || !attempt) notFound();
  const data: SpeakingResultView = {
    scenario,
    attempt: {
      id: attempt._id.toString(),
      scenarioId: attempt.scenarioId.toString(),
      status: attempt.status,
      transcript: attempt.transcript,
      feedback: attempt.feedback,
      failureCode: attempt.failureCode,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString(),
    },
  };
  return <SpeakingResult data={data} locale={locale} />;
}
