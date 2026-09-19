import { getTranslations } from "next-intl/server";

import { CourseOutline } from "@/components/learning/course-outline";
import { LearningBreadcrumbs } from "@/components/learning/learning-breadcrumbs";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { CurriculumCourse, CurriculumLevel } from "@/lib/learning/types";

export async function LevelView({
  level,
  courses,
  locale,
}: {
  level: CurriculumLevel;
  courses: CurriculumCourse[];
  locale: AppLocale;
}) {
  const t = await getTranslations("learn");

  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-5xl">
          <LearningBreadcrumbs items={[{ label: t("home.breadcrumb"), href: "/learn" }, { label: localize(level.title, locale) }]} />
          <div className="mb-10 max-w-3xl">
            <Badge variant="outline">{level.code}</Badge>
            <h1 className="text-h1 mt-4">{localize(level.title, locale)}</h1>
            <p className="text-body mt-4 text-muted-foreground">
              {localize(level.description, locale)}
            </p>
          </div>
          <div className="mb-5">
            <p className="text-label flex items-center gap-3 font-semibold uppercase tracking-[0.14em] text-gold"><span aria-hidden className="eyebrow-rule" />{t("level.eyebrow")}</p>
            <h2 className="text-h2 mt-2">{t("level.title")}</h2>
          </div>
          <CourseOutline levelSlug={level.slug} courses={courses} locale={locale} />
        </div>
      </Container>
    </main>
  );
}
