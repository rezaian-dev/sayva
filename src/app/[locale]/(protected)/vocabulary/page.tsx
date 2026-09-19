import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { VocabularyHome } from "@/components/vocabulary/vocabulary-home";
import { getVocabularyHomeData } from "@/lib/db/vocabulary";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function VocabularyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getVocabularyHomeData(session.user.id);
  return <VocabularyHome data={data} locale={locale} />;
}
