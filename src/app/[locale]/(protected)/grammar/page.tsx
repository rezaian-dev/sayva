import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { GrammarHome } from "@/components/grammar/grammar-home";
import { getGrammarHomeData } from "@/lib/db/grammar";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function GrammarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getGrammarHomeData(session.user.id);
  return <GrammarHome data={data} locale={locale} />;
}
