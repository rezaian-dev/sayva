import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { ReadingHome } from "@/components/reading/reading-home";
import { getReadingHomeData } from "@/lib/db/reading";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function ReadingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getReadingHomeData(session.user.id);
  return <ReadingHome data={data} locale={locale} />;
}
