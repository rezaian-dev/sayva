import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LearningBreadcrumbs } from "@/components/learning/learning-breadcrumbs";
import { Container } from "@/components/container";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { learningUnitPath } from "@/lib/learning/paths";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { CurriculumCourse, CurriculumLevel } from "@/lib/learning/types";

export async function CourseView({
  level,
  course,
  locale,
}: {
  level: CurriculumLevel;
  course: CurriculumCourse;
  locale: AppLocale;
}) {
  const t = await getTranslations("learn");

  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-5xl">
          <LearningBreadcrumbs
            items={[
              { label: t("home.breadcrumb"), href: "/learn" },
              { label: localize(level.title, locale), href: `/learn/${level.slug}` },
              { label: localize(course.title, locale) },
            ]}
          />
          <div className="mb-10 max-w-3xl">
            <p className="text-label text-gold">{t("labels.course")} {String(course.order).padStart(2, "0")}</p>
            <h1 className="text-h1 mt-3 flex items-center gap-3">
              <BookOpen aria-hidden className="size-7 text-gold" />
              {localize(course.title, locale)}
            </h1>
            <p className="text-body mt-4 text-muted-foreground">
              {localize(course.description, locale)}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {course.units.map((unit) => (
              <Card key={unit.id}>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-caption text-muted-foreground">
                      {t("labels.unit")} {String(unit.order).padStart(2, "0")}
                    </p>
                    <h2 className="text-h3 mt-1">{localize(unit.title, locale)}</h2>
                    <p className="text-body-sm mt-1 text-muted-foreground">
                      {localize(unit.description, locale)}
                    </p>
                  </div>
                  <Link
                    href={learningUnitPath(level.slug, course.slug, unit.slug)}
                    className="shrink-0 rounded-lg px-3 py-2 text-body-sm font-medium text-primary hover:bg-muted"
                  >
                    {t("actions.openUnit")}
                  </Link>
                </CardContent>
              </Card>
            ))}
            {!course.units.length ? (
              <Card>
                <CardContent className="py-10 text-center text-body text-muted-foreground">
                  {t("empty.units")}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </Container>
    </main>
  );
}
