import { Mic2, ArrowRight, ArrowLeft, Clock3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/container";
import { SpeakingNavigation } from "@/components/speaking/speaking-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { SpeakingScenarioListItem } from "@/lib/speaking/types";

export async function SpeakingHome({ scenarios, locale }: { scenarios: SpeakingScenarioListItem[]; locale: AppLocale }) {
  const t = await getTranslations("speaking");
  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-5xl">
          <SpeakingNavigation />
          <header className="mt-8 max-w-3xl">
            <p className="text-label text-gold">{t("home.eyebrow")}</p>
            <h1 className="text-h1 mt-3">{t("home.title")}</h1>
            <p className="text-body mt-4 text-muted-foreground">{t("home.description")}</p>
          </header>
          <section aria-labelledby="speaking-scenarios" className="mt-10">
            <h2 id="speaking-scenarios" className="text-h2">{t("home.available")}</h2>
            {scenarios.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {scenarios.map((scenario) => (
                  <Card key={scenario.id} className="flex h-full flex-col">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2 text-label text-gold">
                        {scenario.level ? <span>{t("home.level", { value: scenario.level })}</span> : null}
                        {scenario.topic ? <span className="text-muted-foreground">{t("home.topic", { value: scenario.topic })}</span> : null}
                      </div>
                      <CardTitle className="flex items-start gap-3 text-h3"><Mic2 aria-hidden className="mt-1 size-5 shrink-0" />{localize(scenario.title, locale)}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-5">
                      <p className="text-body-sm text-muted-foreground">{localize(scenario.description, locale)}</p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-caption text-muted-foreground"><Clock3 aria-hidden className="size-4" />{t("home.duration", { count: scenario.durationLimitSeconds })}</span>
                        <Link href={`/speaking/${scenario.id}`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-body-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          {t("home.open")}{locale === "fa" ? <ArrowLeft aria-hidden className="size-4" /> : <ArrowRight aria-hidden className="size-4" />}
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-8 text-body-sm text-muted-foreground">{t("home.empty")}</div>
            )}
          </section>
        </div>
      </Container>
    </main>
  );
}
