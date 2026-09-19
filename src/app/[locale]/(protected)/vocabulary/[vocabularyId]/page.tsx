import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { VocabularyDetailView } from "@/components/vocabulary/vocabulary-detail";
import { getVocabularyDetailData } from "@/lib/db/vocabulary";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function VocabularyDetailPage({ params }: { params: Promise<{ locale: string; vocabularyId: string }> }) {
  const { locale: rawLocale, vocabularyId } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getVocabularyDetailData(session.user.id, vocabularyId);
  if (!data) notFound();
  return <VocabularyDetailView data={data} locale={locale} />;
}
