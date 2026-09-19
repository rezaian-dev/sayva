import { CheckCircle2, Circle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LearningBreadcrumbs } from "@/components/learning/learning-breadcrumbs";
import { Container } from "@/components/container";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { learningCoursePath, learningLessonPath } from "@/lib/learning/paths";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { CurriculumCourse, CurriculumLevel, CurriculumUnit } from "@/lib/learning/types";

export async function UnitView({
  level,
  course,
  unit,
  locale,
}: {
  level: CurriculumLevel;
  course: CurriculumCourse;
  unit: CurriculumUnit;
  locale: AppLocale;
}) {
  const t = await getTranslations("learn");

  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-4xl">
          <LearningBreadcrumbs
            items={[
              { label: t("home.breadcrumb"), href: "/learn" },
              { label: localize(level.title, locale), href: `/learn/${level.slug}` },
              { label: localize(course.title, locale), href: learningCoursePath(level.slug, course.slug) },
              { label: localize(unit.title, locale) },
            ]}
          />
          <div className="mb-10 max-w-3xl">
            <p className="text-label text-gold">{t("labels.unit")} {String(unit.order).padStart(2, "0")}</p>
            <h1 className="text-h1 mt-3">{localize(unit.title, locale)}</h1>
            <p className="text-body mt-4 text-muted-foreground">
              {localize(unit.description, locale)}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {unit.lessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardContent className="flex items-center gap-4 p-5">
                  {lesson.completed ? (
                    <CheckCircle2 aria-label={t("statuses.completed")} className="size-5 shrink-0 text-success" />
                  ) : (
                    <Circle aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-muted-foreground">
                      {t("labels.lesson")} {String(lesson.order).padStart(2, "0")}
                    </p>
                    <h2 className="text-h3 mt-1">{localize(lesson.title, locale)}</h2>
                    <p className="text-body-sm mt-1 text-muted-foreground">
                      {localize(lesson.description, locale)}
                    </p>
                  </div>
                  <Link
                    href={learningLessonPath(level.slug, course.slug, unit.slug, lesson.slug)}
                    className="shrink-0 rounded-lg px-3 py-2 text-body-sm font-medium text-primary hover:bg-muted"
                  >
                    {t("actions.openLesson")}
                  </Link>
                </CardContent>
              </Card>
            ))}
            {!unit.lessons.length ? (
              <Card>
                <CardContent className="py-10 text-center text-body text-muted-foreground">
                  {t("empty.lessons")}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </Container>
    </main>
  );
}
