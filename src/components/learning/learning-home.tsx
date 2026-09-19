import { ArrowUpLeft, ArrowUpRight, CheckCircle2, Compass, Play } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CourseOutline } from "@/components/learning/course-outline";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { learningLessonPath, learningLevelPath } from "@/lib/learning/paths";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { LearningHomeData } from "@/lib/learning/types";

export async function LearningHome({
  data,
  locale,
}: {
  data: LearningHomeData;
  locale: AppLocale;
}) {
  const t = await getTranslations("learn");
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  const progressPercent = data.totalLessons
    ? Math.round((data.completedLessons / data.totalLessons) * 100)
    : 0;

  return (
    <main className="flex flex-1 bg-background py-10 md:py-14">
      <Container>
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-9 max-w-3xl">
            <p className="text-label flex items-center gap-3 font-semibold uppercase tracking-[0.14em] text-gold">
              <span aria-hidden className="eyebrow-rule" />
              {t("home.eyebrow")}
            </p>
            <h1 className="text-h1 mt-4">{t("home.title")}</h1>
            <p className="text-body mt-4 text-muted-foreground">
              {t("home.description")}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-full border border-gold/40 bg-accent">
                    <Compass aria-hidden className="size-4 text-gold" />
                  </span>
                  {t("home.currentLevel")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.currentLevel ? (
                  <>
                    <p className="text-h2">{localize(data.currentLevel.title, locale)}</p>
                    <p className="text-body-sm mt-2 text-muted-foreground">
                      {data.currentLevel.code} · {localize(data.currentLevel.description, locale)}
                    </p>
                  </>
                ) : (
                  <p className="text-body-sm text-muted-foreground">{t("empty.levels")}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-full border border-success/40 bg-success/10">
                    <CheckCircle2 aria-hidden className="size-4 text-success" />
                  </span>
                  {t("home.progress")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-h2 tabular-nums">{progressPercent}%</p>
                <p className="text-body-sm mt-2 text-muted-foreground">
                  {t("progress.lessons", {
                    completed: data.completedLessons,
                    total: data.totalLessons,
                  })}
                </p>
                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={t("home.progress")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                >
                  <div
                    className="progress-fill h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardHeader>
                <CardTitle>{t("home.nextStep")}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.currentLesson ? (
                  <>
                    <p className="text-h3">{localize(data.currentLesson.title, locale)}</p>
                    <p className="text-body-sm mt-2 text-muted-foreground">
                      {localize(data.currentLesson.description, locale)}
                    </p>
                    <Button asChild className="mt-5 w-full">
                      <Link
                        href={learningLessonPath(
                          data.currentLesson.levelSlug,
                          data.currentLesson.courseSlug,
                          data.currentLesson.unitSlug,
                          data.currentLesson.slug,
                        )}
                      >
                        <Play aria-hidden />
                        {t("actions.continue")}
                        <Arrow aria-hidden />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-body-sm text-muted-foreground">
                    {data.totalLessons ? t("home.allComplete") : t("empty.curriculum")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <section className="mt-14" aria-labelledby="available-levels">
            <div className="mb-6">
              <p className="text-label text-gold">{t("home.curriculumEyebrow")}</p>
              <h2 id="available-levels" className="text-h2 mt-2">
                {t("home.curriculumTitle")}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.levels.map((level) => (
                <Link
                  key={level.id}
                  href={learningLevelPath(level.slug)}
                  className="group relative rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline">{level.code}</Badge>
                      <h3 className="text-h3 mt-3 transition-colors group-hover:text-gold">
                        {localize(level.title, locale)}
                      </h3>
                    </div>
                    <Arrow
                      aria-hidden
                      className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5"
                    />
                  </div>
                  <p className="text-body-sm mt-2 text-muted-foreground">
                    {localize(level.description, locale)}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-14" aria-labelledby="current-curriculum">
            <div className="mb-6">
              <p className="text-label text-gold">{t("home.currentEyebrow")}</p>
              <h2 id="current-curriculum" className="text-h2 mt-2">
                {t("home.currentTitle")}
              </h2>
            </div>
            <CourseOutline
              levelSlug={data.currentLevel?.slug ?? ""}
              courses={data.courses}
              locale={locale}
            />
          </section>
        </div>
      </Container>
    </main>
  );
}
