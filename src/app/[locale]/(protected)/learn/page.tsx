import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { LearningHome } from "@/components/learning/learning-home";
import { getLearningHomeData } from "@/lib/db/learning";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function LearningHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session, profile } = await requireLearner(locale);
  const data = await getLearningHomeData(session.user.id, profile.level);

  return <LearningHome data={data} locale={locale} />;
}
