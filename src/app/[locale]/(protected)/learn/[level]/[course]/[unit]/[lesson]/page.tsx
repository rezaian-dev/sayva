import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { LessonView } from "@/components/learning/lesson-view";
import { getLessonPageData } from "@/lib/db/learning";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function LessonPage({
  params,
}: {
  params: Promise<{
    locale: string;
    level: string;
    course: string;
    unit: string;
    lesson: string;
  }>;
}) {
  const { locale: rawLocale, level, course, unit, lesson } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const data = await getLessonPageData(session.user.id, level, course, unit, lesson);

  if (!data) notFound();

  return <LessonView data={data} locale={locale} />;
}
