import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { PracticeView } from "@/components/practice/practice-view";
import { getPracticePageData } from "@/lib/db/practice";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ locale: string; practiceSetId: string }>;
}) {
  const { locale: rawLocale, practiceSetId } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getPracticePageData(session.user.id, practiceSetId);
  if (!data) notFound();

  return <PracticeView data={data} locale={locale} />;
}
