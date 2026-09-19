import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { UnitView } from "@/components/learning/unit-view";
import { getUnitCurriculum } from "@/lib/db/learning";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function UnitPage({
  params,
}: {
  params: Promise<{
    locale: string;
    level: string;
    course: string;
    unit: string;
  }>;
}) {
  const { locale: rawLocale, level, course, unit } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session } = await requireLearner(locale);
  const curriculum = await getUnitCurriculum(session.user.id, level, course, unit);

  if (!curriculum) notFound();

  return (
    <UnitView
      level={curriculum.level}
      course={curriculum.course}
      unit={curriculum.unit}
      locale={locale}
    />
  );
}
