import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { PracticeResult } from "@/components/practice/practice-result";
import { getPracticeResultData } from "@/lib/db/practice";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function PracticeResultsPage({
  params,
}: {
  params: Promise<{ locale: string; practiceSetId: string }>;
}) {
  const { locale: rawLocale, practiceSetId } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getPracticeResultData(session.user.id, practiceSetId);
  if (!data) notFound();

  return <PracticeResult data={data} locale={locale} />;
}
