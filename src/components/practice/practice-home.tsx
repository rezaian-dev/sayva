import { ArrowUpLeft, ArrowUpRight, Play, RotateCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import { practicePath } from "@/lib/practice/paths";
import type { AppLocale } from "@/i18n/routing";
import type { PracticeHomeData } from "@/lib/practice/types";
import { EmptyState } from "@/components/domains/empty-state";

export async function PracticeHome({
  data,
  locale,
}: {
  data: PracticeHomeData;
  locale: AppLocale;
}) {
  const t = await getTranslations("practice.home");
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;

  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-5xl">
          <header className="max-w-3xl">
            <p className="text-label flex items-center gap-3 font-semibold uppercase tracking-[0.14em] text-gold"><span aria-hidden className="eyebrow-rule" />{t("eyebrow")}</p>
            <h1 className="text-h1 mt-3">{t("title")}</h1>
            <p className="text-body mt-4 text-muted-foreground">{t("description")}</p>
          </header>

          <section className="mt-10" aria-labelledby="practice-sets">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 id="practice-sets" className="text-h2">{t("available")}</h2>
              <Badge variant="outline">{data.sets.length}</Badge>
            </div>
            {data.sets.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.sets.map((set) => (
                  <Card key={set.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle>{localize(set.title, locale)}</CardTitle>
                        <Badge variant={set.active ? "secondary" : "outline"}>
                          {set.active ? t("status.active") : t("status.ready")}
                        </Badge>
                      </div>
                      <p className="text-body-sm text-muted-foreground">
                        {localize(set.description, locale)}
                      </p>
                    </CardHeader>
                    <CardContent className="mt-auto flex items-center justify-between gap-4">
                      <p className="text-body-sm text-muted-foreground">
                        {t("exerciseCount", { count: set.exerciseCount })}
                      </p>
                      <Link
                        href={practicePath(set.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {set.active ? <RotateCcw aria-hidden /> : <Play aria-hidden />}
                        {set.active ? t("continue") : t("open")}
                        <Arrow aria-hidden />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState message={t("empty")} />
            )}
          </section>
        </div>
      </Container>
    </main>
  );
}
