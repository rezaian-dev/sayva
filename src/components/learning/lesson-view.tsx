import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LessonCompletionForm } from "@/components/learning/lesson-completion-form";
import { LearningBreadcrumbs } from "@/components/learning/learning-breadcrumbs";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { learningLessonPath, learningUnitPath } from "@/lib/learning/paths";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { LessonPageData } from "@/lib/learning/types";

export async function LessonView({
  data,
  locale,
}: {
  data: LessonPageData;
  locale: AppLocale;
}) {
  const t = await getTranslations("learn.lesson");
  const kindLabels = {
    introduction: t("contentKinds.introduction"),
    explanation: t("contentKinds.explanation"),
    example: t("contentKinds.example"),
    summary: t("contentKinds.summary"),
  };

  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <article className="mx-auto w-full max-w-4xl">
          <LearningBreadcrumbs
            items={[
              { label: t("breadcrumbs.home"), href: "/learn" },
              { label: localize(data.level.title, locale), href: `/learn/${data.level.slug}` },
              { label: localize(data.course.title, locale), href: `/learn/${data.level.slug}/${data.course.slug}` },
              { label: localize(data.unit.title, locale), href: learningUnitPath(data.level.slug, data.course.slug, data.unit.slug) },
              { label: localize(data.lesson.title, locale) },
            ]}
          />

          <header className="border-b border-border/80 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{data.level.code}</Badge>
              {data.lesson.estimatedDuration ? (
                <Badge variant="secondary">
                  <Clock3 aria-hidden />
                  {data.lesson.estimatedDuration} {t("minutes")}
                </Badge>
              ) : null}
              {data.completed ? (
                <Badge variant="secondary">
                  <CheckCircle2 aria-hidden />
                  {t("completed")}
                </Badge>
              ) : null}
            </div>
            <h1 className="text-h1 mt-5">{localize(data.lesson.title, locale)}</h1>
            <p className="text-body mt-4 max-w-3xl text-muted-foreground">
              {localize(data.lesson.description, locale)}
            </p>
          </header>

          <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="min-w-0">
              {data.lesson.objectives.length ? (
                <section aria-labelledby="lesson-objectives" className="mb-10 rounded-xl border border-gold/40 bg-gold/10 p-5">
                  <h2 id="lesson-objectives" className="text-h3">{t("objectives")}</h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {data.lesson.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3 text-body-sm">
                        <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
                        <span>{localize(objective, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="flex flex-col gap-8">
                {data.lesson.content
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((block) => (
                    <section key={block.key} aria-labelledby={`lesson-section-${block.key}`}>
                      <p className="text-label text-gold">
                        {kindLabels[block.kind as keyof typeof kindLabels] ?? block.kind}
                      </p>
                      <h2 id={`lesson-section-${block.key}`} className="text-h2 mt-2">
                        {localize(block.title, locale)}
                      </h2>
                      <p className="text-body mt-4 whitespace-pre-line text-foreground/85">
                        {localize(block.body, locale)}
                      </p>
                    </section>
                  ))}
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle>{t("finishTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm mb-5 text-muted-foreground">
                    {data.completed ? t("alreadyComplete") : t("finishBody")}
                  </p>
                  <LessonCompletionForm lessonId={data.lesson.id} completed={data.completed} />
                </CardContent>
              </Card>
            </aside>
          </div>

          <nav aria-label={t("navigationLabel")} className="grid gap-3 border-t border-border/80 pt-6 sm:grid-cols-2">
            {data.previousLesson ? (
              <Link
                href={learningLessonPath(data.previousLesson.levelSlug, data.previousLesson.courseSlug, data.previousLesson.unitSlug, data.previousLesson.slug)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-body-sm hover:bg-muted"
              >
                <ArrowLeft aria-hidden className="size-4 shrink-0 rtl:rotate-180" />
                <span className="min-w-0">
                  <span className="text-caption block text-muted-foreground">{t("previous")}</span>
                  <span className="mt-1 block truncate font-medium">{localize(data.previousLesson.title, locale)}</span>
                </span>
              </Link>
            ) : <span />}
            {data.nextLesson ? (
              <Link
                href={learningLessonPath(data.nextLesson.levelSlug, data.nextLesson.courseSlug, data.nextLesson.unitSlug, data.nextLesson.slug)}
                className="flex items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 text-end text-body-sm hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="text-caption block text-muted-foreground">{t("next")}</span>
                  <span className="mt-1 block truncate font-medium">{localize(data.nextLesson.title, locale)}</span>
                </span>
                <ArrowRight aria-hidden className="size-4 shrink-0 rtl:rotate-180" />
              </Link>
            ) : null}
          </nav>
        </article>
      </Container>
    </main>
  );
}
