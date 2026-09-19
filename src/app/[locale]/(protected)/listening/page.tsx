import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { ListeningHome } from "@/components/listening/listening-home";
import { getListeningHomeData } from "@/lib/db/listening";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function ListeningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getListeningHomeData(session.user.id);
  return <ListeningHome data={data} locale={locale} />;
}
