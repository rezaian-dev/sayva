import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { LevelView } from "@/components/learning/level-view";
import { getLevelCurriculum } from "@/lib/db/learning";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function LevelPage({
  params,
}: {
  params: Promise<{ locale: string; level: string }>;
}) {
  const { locale: rawLocale, level: levelSlug } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const curriculum = await getLevelCurriculum(session.user.id, levelSlug);

  if (!curriculum) notFound();

  return <LevelView level={curriculum.level} courses={curriculum.courses} locale={locale} />;
}
