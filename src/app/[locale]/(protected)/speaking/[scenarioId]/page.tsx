import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { SpeakingDetail } from "@/components/speaking/speaking-detail";
import { getPublishedSpeakingScenario } from "@/lib/db/speaking";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function SpeakingScenarioPage({ params }: { params: Promise<{ locale: string; scenarioId: string }> }) {
  const { locale: rawLocale, scenarioId } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  await requireLearner(locale);
  const scenario = await getPublishedSpeakingScenario(scenarioId);
  if (!scenario) notFound();
  return <SpeakingDetail scenario={scenario} locale={locale} />;
}
