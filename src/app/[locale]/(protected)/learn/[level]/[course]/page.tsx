import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { CourseView } from "@/components/learning/course-view";
import { getCourseCurriculum } from "@/lib/db/learning";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; level: string; course: string }>;
}) {
  const { locale: rawLocale, level, course } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const curriculum = await getCourseCurriculum(session.user.id, level, course);

  if (!curriculum) notFound();

  return <CourseView level={curriculum.level} course={curriculum.course} locale={locale} />;
}
