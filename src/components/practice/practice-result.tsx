import { CheckCircle2, RotateCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import { practicePath } from "@/lib/practice/paths";
import type { AppLocale } from "@/i18n/routing";

export async function PracticeResult({
  data,
  locale,
}: {
  data: {
    set: { id: string; title: { fa: string; en: string }; description: { fa: string; en: string } };
    result: { correctCount: number; totalCount: number; scorePercent: number };
  };
  locale: AppLocale;
}) {
  const t = await getTranslations("practice.result");

  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-2xl">
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground">
              <CheckCircle2 aria-hidden className="size-8 text-gold" />
              <CardTitle className="text-h1 mt-4">{t("title")}</CardTitle>
              <p className="text-body text-primary-foreground/75">{localize(data.set.title, locale)}</p>
            </CardHeader>
            <CardContent className="grid gap-6 py-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/40 p-5">
                  <p className="text-label text-muted-foreground">{t("score")}</p>
                  <p className="text-h1 mt-2">{data.result.scorePercent}%</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-5">
                  <p className="text-label text-muted-foreground">{t("correct")}</p>
                  <p className="text-h2 mt-2">{t("correctCount", { correct: data.result.correctCount, total: data.result.totalCount })}</p>
                </div>
              </div>
              <p className="text-body text-muted-foreground">{t("body")}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href={practicePath(data.set.id)}>
                    <RotateCcw aria-hidden />
                    {t("retry")}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/practice">{t("allPractice")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
