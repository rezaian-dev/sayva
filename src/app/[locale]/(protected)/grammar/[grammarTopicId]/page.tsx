import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { GrammarDetailView } from "@/components/grammar/grammar-detail";
import { getGrammarDetailData } from "@/lib/db/grammar";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function GrammarDetailPage({ params }: { params: Promise<{ locale: string; grammarTopicId: string }> }) {
  const { locale: rawLocale, grammarTopicId } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getGrammarDetailData(session.user.id, grammarTopicId);
  if (!data) notFound();
  return <GrammarDetailView data={data} locale={locale} />;
}
