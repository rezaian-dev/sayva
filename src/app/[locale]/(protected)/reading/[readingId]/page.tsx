import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { ReadingDetailView } from "@/components/reading/reading-detail";
import { getReadingDetailData } from "@/lib/db/reading";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function ReadingDetailPage({ params }: { params: Promise<{ locale: string; readingId: string }> }) {
  const { locale: rawLocale, readingId } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getReadingDetailData(session.user.id, readingId);
  if (!data) notFound();
  return <ReadingDetailView data={data} locale={locale} />;
}
