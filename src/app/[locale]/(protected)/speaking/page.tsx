import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { SpeakingHome } from "@/components/speaking/speaking-home";
import { listPublishedSpeakingScenarios } from "@/lib/db/speaking";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function SpeakingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  await requireLearner(locale);
  const scenarios = await listPublishedSpeakingScenarios();
  return <SpeakingHome scenarios={scenarios} locale={locale} />;
}
