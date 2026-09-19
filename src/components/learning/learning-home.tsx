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

          {data.completedLessons === 0 && data.currentLesson ? (
            <section
              aria-labelledby="start-here"
              className="relative mb-9 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-b from-accent/70 via-card to-card p-6 shadow-soft md:p-8"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
              />
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <p className="text-label flex items-center gap-3 font-semibold uppercase tracking-[0.14em] text-gold">
                    <span aria-hidden className="eyebrow-rule" />
                    {t("guide.eyebrow")}
                  </p>
                  <h2 id="start-here" className="text-h2 mt-3">
                    {t("guide.title")}
                  </h2>
                  <p className="text-body mt-3 text-muted-foreground">{t("guide.body")}</p>
                  <ol className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                    {[t("guide.step1"), t("guide.step2"), t("guide.step3")].map((step, index) => (
                      <li key={step} className="text-body-sm flex items-center gap-2 font-medium">
                        <span className="text-label flex size-6 items-center justify-center rounded-full border border-gold/40 bg-background font-bold text-gold">
                          {(index + 1).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <Button asChild size="lg" className="shrink-0">
                  <Link
                    href={learningLessonPath(
                      data.currentLesson.levelSlug,
                      data.currentLesson.courseSlug,
                      data.currentLesson.unitSlug,
                      data.currentLesson.slug,
                    )}
                  >
                    <Play aria-hidden />
                    {t("guide.cta")}
                    <Arrow aria-hidden />
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}

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
                ) : data.totalLessons ? (
                  <>
                    <p className="text-body-sm text-muted-foreground">{t("home.allComplete")}</p>
                    <p className="text-body-sm mt-3 text-muted-foreground">
                      {t("home.practiceBody")}
                    </p>
                    <Button asChild variant="secondary" className="mt-5 w-full">
                      <Link href="/practice">
                        {t("home.practiceCta")}
                        <Arrow aria-hidden />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-body-sm text-muted-foreground">{t("empty.curriculum")}</p>
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
