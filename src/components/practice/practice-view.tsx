import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/container";
import { StartPracticeForm } from "@/components/practice/start-practice-form";
import { PracticeQuestion } from "@/components/practice/practice-question";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import { practicePath, practiceResultsPath } from "@/lib/practice/paths";
import type { AppLocale } from "@/i18n/routing";
import type { PracticePageData } from "@/lib/practice/types";

export async function PracticeView({
  data,
  locale,
}: {
  data: PracticePageData;
  locale: AppLocale;
}) {
  const t = await getTranslations("practice");
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-3xl">
          <nav className="mb-8" aria-label={t("navigationLabel")}>
            <Link href="/practice" className="inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground">
              <Arrow aria-hidden className="size-4 rtl:rotate-180" />
              {t("backToPractice")}
            </Link>
          </nav>

          <header className="mb-8">
            <p className="text-label flex items-center gap-3 font-semibold uppercase tracking-[0.14em] text-gold"><span aria-hidden className="eyebrow-rule" />{t("eyebrow")}</p>
            <h1 className="text-h1 mt-3">{localize(data.set.title, locale)}</h1>
            <p className="text-body mt-4 text-muted-foreground">{localize(data.set.description, locale)}</p>
          </header>

          {data.session && data.currentExercise ? (
            <PracticeQuestion
              key={data.currentExercise.id}
              exercise={data.currentExercise}
              sessionId={data.session.id}
              practiceSetId={data.set.id}
              locale={locale}
              questionNumber={data.session.answeredCount + 1}
              totalCount={data.session.totalCount}
            />
          ) : data.session ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-body">{t("session.completePending")}</p>
                <Button asChild className="mt-5">
                  <Link href={practiceResultsPath(data.set.id)}>{t("viewResult")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <Badge variant="outline" className="w-fit">{t("status.ready")}</Badge>
                <CardTitle className="mt-3">{t("startTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm mb-6 text-muted-foreground">
                  {t("startBody", { count: data.set.exerciseCount })}
                </p>
                {data.set.exerciseCount ? (
                  <StartPracticeForm practiceSetId={data.set.id} locale={locale} />
                ) : (
                  <p className="text-body-sm text-muted-foreground">{t("empty")}</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5 text-body-sm text-muted-foreground">
            <span>{t("serverAuthority")}</span>
            <Link href={practicePath(data.set.id)} className="inline-flex items-center gap-2 hover:text-foreground">
              <RotateCcw aria-hidden className="size-4" />
              {t("refresh")}
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
