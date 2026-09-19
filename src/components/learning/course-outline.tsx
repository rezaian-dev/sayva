import { BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  learningCoursePath,
  learningLessonPath,
  learningUnitPath,
} from "@/lib/learning/paths";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { CurriculumCourse, CurriculumUnit } from "@/lib/learning/types";

export async function CourseOutline({
  levelSlug,
  courses,
  locale,
}: {
  levelSlug: string;
  courses: CurriculumCourse[];
  locale: AppLocale;
}) {
  const t = await getTranslations("learn");

  if (!courses.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-body text-muted-foreground">{t("empty.curriculum")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardHeader className="gap-3 border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption text-muted-foreground">
                  {t("labels.course")} {String(course.order).padStart(2, "0")}
                </p>
                <CardTitle className="mt-1 flex items-center gap-2">
                  <BookOpen aria-hidden className="size-5 text-gold" />
                  {localize(course.title, locale)}
                </CardTitle>
                <p className="text-body-sm mt-2 text-muted-foreground">
                  {localize(course.description, locale)}
                </p>
              </div>
              <Link
                href={learningCoursePath(levelSlug, course.slug)}
                aria-label={`${t("actions.openCourse")}: ${localize(course.title, locale)}`}
                className="mt-1 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronRight aria-hidden className="size-5 rtl:rotate-180" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            {course.units.map((unit) => (
              <UnitPreview
                key={unit.id}
                levelSlug={levelSlug}
                courseSlug={course.slug}
                unit={unit}
                locale={locale}
              />
            ))}
            {!course.units.length ? (
              <p className="text-body-sm text-muted-foreground">
                {t("empty.units")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function UnitPreview({
  levelSlug,
  courseSlug,
  unit,
  locale,
}: {
  levelSlug: string;
  courseSlug: string;
  unit: CurriculumUnit;
  locale: AppLocale;
}) {
  const t = await getTranslations("learn");
  const completed = unit.lessons.filter((lesson) => lesson.completed).length;

  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
      <Link
        href={learningUnitPath(levelSlug, courseSlug, unit.slug)}
        className="group flex items-start justify-between gap-3"
      >
        <div>
          <p className="text-caption text-muted-foreground">
            {t("labels.unit")} {String(unit.order).padStart(2, "0")}
          </p>
          <h3 className="text-h3 mt-1 group-hover:text-primary">
            {localize(unit.title, locale)}
          </h3>
          <p className="text-body-sm mt-1 text-muted-foreground">
            {localize(unit.description, locale)}
          </p>
        </div>
        <ChevronRight aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
        <span className="text-caption text-muted-foreground">
          {t("progress.lessons", { completed, total: unit.lessons.length })}
        </span>
        {completed === unit.lessons.length && unit.lessons.length > 0 ? (
          <Badge variant="secondary">
            <CheckCircle2 aria-hidden />
            {t("statuses.completed")}
          </Badge>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {unit.lessons.slice(0, 3).map((lesson) => (
          <Link
            key={lesson.id}
            href={learningLessonPath(levelSlug, courseSlug, unit.slug, lesson.slug)}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-body-sm hover:bg-background"
          >
            <span className="flex min-w-0 items-center gap-2">
              {lesson.completed ? (
                <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
              ) : (
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-border" />
              )}
              <span className="truncate">{localize(lesson.title, locale)}</span>
            </span>
            <span className="text-caption shrink-0 text-muted-foreground">
              {lesson.estimatedDuration ? `${lesson.estimatedDuration} ${t("labels.minutesShort")}` : null}
            </span>
          </Link>
        ))}
        {unit.lessons.length > 3 ? (
          <Link
            href={learningUnitPath(levelSlug, courseSlug, unit.slug)}
            className="text-caption mt-1 text-primary hover:underline underline-offset-4"
          >
            {t("actions.viewAllLessons")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
