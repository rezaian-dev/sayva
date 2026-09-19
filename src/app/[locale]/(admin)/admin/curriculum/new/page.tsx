import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { CurriculumForm } from "@/components/admin/curriculum-form";
import { requireAdmin } from "@/lib/admin/access";
import { createLearningCourse, createLearningLesson, createLearningLevel, createLearningUnit } from "@/actions/admin-curriculum";
import { routing, type AppLocale } from "@/i18n/routing";
import type { AdminCurriculumEntity } from "@/lib/db/admin";

const entities = ["level", "course", "unit", "lesson"] as const;
const actions = { level: createLearningLevel, course: createLearningCourse, unit: createLearningUnit, lesson: createLearningLesson };

export default async function NewCurriculumPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ entity?: string }> }) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  await requireAdmin(locale);
  const query = await searchParams;
  if (!entities.includes(query.entity as (typeof entities)[number])) notFound();
  const entity = query.entity as AdminCurriculumEntity;
  const initial = entity === "level" ? { order: 0, code: "" } : entity === "course" ? { order: 0, levelId: "" } : entity === "unit" ? { order: 0, courseId: "" } : { order: 0, unitId: "", objectives: [], content: [] };
  return <CurriculumForm entity={entity} initial={initial} action={actions[entity]} edit={false} />;
}
