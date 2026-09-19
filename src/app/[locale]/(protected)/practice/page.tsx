import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { PracticeHome } from "@/components/practice/practice-home";
import { getPracticeHomeData } from "@/lib/db/practice";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function PracticeHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getPracticeHomeData(session.user.id);

  return <PracticeHome data={data} locale={locale} />;
}
