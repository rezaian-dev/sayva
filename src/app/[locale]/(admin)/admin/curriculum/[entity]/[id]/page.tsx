import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { CurriculumForm, CurriculumStatusForm } from "@/components/admin/curriculum-form";
import { requireAdmin } from "@/lib/admin/access";
import { getAdminCurriculumRecord, type AdminCurriculumEntity } from "@/lib/db/admin";
import { setLearningCourseStatus, setLearningLessonStatus, setLearningLevelStatus, setLearningUnitStatus, updateLearningCourse, updateLearningLesson, updateLearningLevel, updateLearningUnit } from "@/actions/admin-curriculum";
import { routing, type AppLocale } from "@/i18n/routing";

const entities = ["level", "course", "unit", "lesson"] as const;
const actions = { level: { update: updateLearningLevel, status: setLearningLevelStatus }, course: { update: updateLearningCourse, status: setLearningCourseStatus }, unit: { update: updateLearningUnit, status: setLearningUnitStatus }, lesson: { update: updateLearningLesson, status: setLearningLessonStatus } };

function values(record: Record<string, unknown>, id: string) { const output: Record<string, unknown> = { ...record, id }; for (const key of ["levelId", "courseId", "unitId"]) { const item = record[key]; if (item && typeof item === "object") output[key] = String(item); } return output; }

export default async function EditCurriculumPage({ params }: { params: Promise<{ locale: string; entity: string; id: string }> }) {
  const { locale: rawLocale, entity: rawEntity, id } = await params;
  if (!hasLocale(routing.locales, rawLocale) || !entities.includes(rawEntity as (typeof entities)[number])) notFound();
  const locale = rawLocale as AppLocale;
  await requireAdmin(locale);
  const entity = rawEntity as AdminCurriculumEntity;
  const record = await getAdminCurriculumRecord(entity, id);
  if (!record) notFound();
  const initial = values(record as unknown as Record<string, unknown>, id);
  return <><CurriculumForm entity={entity} initial={initial} action={actions[entity].update} edit /><CurriculumStatusForm id={id} status={initial.status as "draft" | "published" | "archived"} action={actions[entity].status} /></>;
}
