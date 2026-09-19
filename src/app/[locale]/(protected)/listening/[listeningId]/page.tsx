import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { ListeningDetailView } from "@/components/listening/listening-detail";
import { getListeningDetailData } from "@/lib/db/listening";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function ListeningDetailPage({ params }: { params: Promise<{ locale: string; listeningId: string }> }) {
  const { locale: rawLocale, listeningId } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getListeningDetailData(session.user.id, listeningId);
  if (!data) notFound();
  return <ListeningDetailView data={data} locale={locale} />;
}
