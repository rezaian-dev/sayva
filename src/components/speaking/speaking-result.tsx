import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/container";
import { SpeakingNavigation } from "@/components/speaking/speaking-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import type { AppLocale } from "@/i18n/routing";
import type { SpeakingResultView } from "@/lib/speaking/types";

export async function SpeakingResult({ data, locale }: { data: SpeakingResultView; locale: AppLocale }) {
  const t = await getTranslations("speaking");
  const result = data.attempt;
  const BackArrow = locale === "fa" ? ArrowRight : ArrowLeft;
  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container><div className="mx-auto w-full max-w-4xl"><SpeakingNavigation />
        <Link href={`/speaking/${data.scenario.id}`} className="mt-8 inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><BackArrow aria-hidden className="size-4" />{t("results.back")}</Link>
        <header className="mt-6 border-b border-border/70 pb-8"><p className="text-label text-gold">{t("results.completed")}</p><h1 className="text-h1 mt-3">{localize(data.scenario.title, locale)}</h1></header>
        <div className="mt-8 grid gap-6">
          {result.status === "completed" && result.transcript ? <Card><CardHeader><CardTitle>{t("results.transcript")}</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-body" dir="ltr">{result.transcript}</p></CardContent></Card> : null}
          {result.status === "completed" && result.feedback ? <Feedback feedback={result.feedback} /> : null}
          {result.status === "failed" && result.transcript ? <Card><CardHeader><CardTitle>{t("results.transcript")}</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-body" dir="ltr">{result.transcript}</p><p className="mt-4 text-body-sm text-muted-foreground">{t("results.feedbackUnavailable")}</p></CardContent></Card> : null}
          {result.status === "failed" && !result.transcript ? <Card><CardContent className="pt-6"><p className="text-body">{result.failureCode ? t(`errors.${result.failureCode}`) : t("results.failed")}</p></CardContent></Card> : null}
          {result.status === "started" ? <Card><CardContent className="pt-6"><p className="text-body">{t("results.started")}</p></CardContent></Card> : null}
          {result.status === "recorded" || result.status === "processing" ? <Card><CardContent className="pt-6"><p className="text-body">{t("results.processing")}</p></CardContent></Card> : null}
          <div className="flex flex-wrap gap-3"><Link href={`/speaking/${data.scenario.id}`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-body-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><RotateCcw aria-hidden className="size-4" />{t("results.retry")}</Link><Link href="/speaking" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-body-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><CheckCircle2 aria-hidden className="size-4" />{t("results.continue")}</Link></div>
        </div>
      </div></Container>
    </main>
  );
}

async function Feedback({ feedback }: { feedback: NonNullable<SpeakingResultView["attempt"]["feedback"]> }) {
  const t = await getTranslations("speaking.feedback");
  const sections = [
    ["strengths", feedback.strengths],
    ["areasToImprove", feedback.areasToImprove],
    ["grammarNotes", feedback.grammarNotes],
    ["vocabularySuggestions", feedback.vocabularySuggestions],
    ["fluencyNotes", feedback.fluencyNotes],
  ] as const;
  return <div className="grid gap-6"><Card><CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader><CardContent className="grid gap-5"><p className="text-body">{feedback.overallFeedback}</p>{sections.map(([key, items]) => items.length ? <section key={key} aria-labelledby={`feedback-${key}`}><h2 id={`feedback-${key}`} className="text-h3">{t(key)}</h2><ul className="mt-3 grid gap-2">{items.map((item, index) => <li key={index} className="flex gap-3 text-body-sm"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />{item}</li>)}</ul></section> : null)}{feedback.correctionExamples.length ? <section aria-labelledby="feedback-corrections"><h2 id="feedback-corrections" className="text-h3">{t("corrections")}</h2><div className="mt-3 grid gap-3">{feedback.correctionExamples.map((example, index) => <div key={index} className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-body-sm"><strong>{t("original")}:</strong> <span dir="ltr">{example.original}</span></p><p className="mt-2 text-body-sm"><strong>{t("improved")}:</strong> <span dir="ltr">{example.improved}</span></p><p className="mt-2 text-caption text-muted-foreground">{example.explanation}</p></div>)}</div></section> : null}<div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><h2 className="text-h3">{t("nextAttempt")}</h2><p className="mt-2 text-body-sm">{feedback.nextAttemptSuggestion}</p></div></CardContent></Card></div>;
}
