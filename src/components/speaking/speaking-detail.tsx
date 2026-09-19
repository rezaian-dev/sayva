import { ArrowLeft, ArrowRight, CheckCircle2, Info, Mic2, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/container";
import { SpeakingFlow } from "@/components/speaking/speaking-flow";
import { SpeakingNavigation } from "@/components/speaking/speaking-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { SpeakingScenarioDetail } from "@/lib/speaking/types";

export async function SpeakingDetail({ scenario, locale }: { scenario: SpeakingScenarioDetail; locale: AppLocale }) {
  const t = await getTranslations("speaking");
  const BackArrow = locale === "fa" ? ArrowRight : ArrowLeft;
  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-5xl">
          <SpeakingNavigation />
          <Link href="/speaking" className="mt-8 inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <BackArrow aria-hidden className="size-4" />{t("scenario.back")}
          </Link>
          <header className="mt-6 border-b border-border/70 pb-8">
            <div className="flex flex-wrap items-center gap-2 text-label text-gold"><Mic2 aria-hidden className="size-4" />{scenario.level ?? t("home.eyebrow")} {scenario.topic ? `· ${scenario.topic}` : null}</div>
            <h1 className="text-h1 mt-3">{localize(scenario.title, locale)}</h1>
            <p className="text-body mt-4 max-w-3xl text-muted-foreground">{localize(scenario.description, locale)}</p>
          </header>
          <div className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-6">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Info aria-hidden className="size-5" />{t("scenario.context")}</CardTitle></CardHeader><CardContent><p className="text-body">{localize(scenario.context, locale)}</p></CardContent></Card>
              <div className="grid gap-6 md:grid-cols-2">
                <Card><CardHeader><CardTitle>{t("scenario.role")}</CardTitle></CardHeader><CardContent><p className="text-body">{localize(scenario.role, locale)}</p></CardContent></Card>
                <Card><CardHeader><CardTitle>{t("scenario.objective")}</CardTitle></CardHeader><CardContent><p className="text-body">{localize(scenario.objective, locale)}</p></CardContent></Card>
              </div>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 aria-hidden className="size-5" />{t("scenario.success")}</CardTitle></CardHeader><CardContent><ul className="grid gap-3">{scenario.successCriteria.map((item, index) => <li key={index} className="flex gap-3 text-body"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />{localize(item, locale)}</li>)}</ul></CardContent></Card>
            </div>
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card><CardHeader><CardTitle>{t("scenario.expectedLanguage")}</CardTitle></CardHeader><CardContent className="grid gap-3"><p className="font-en text-lg" dir="ltr">{scenario.expectedLanguage}</p><p className="text-body-sm text-muted-foreground">{t("scenario.duration", { count: scenario.durationLimitSeconds })}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck aria-hidden className="size-5" />{t("scenario.recordingPrivacy")}</CardTitle></CardHeader><CardContent><p className="text-body-sm text-muted-foreground">{t("scenario.recordingPrivacy")}</p></CardContent></Card>
            </aside>
          </div>
          <SpeakingFlow scenario={scenario} locale={locale} />
        </div>
      </Container>
    </main>
  );
}
