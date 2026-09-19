import { ArrowLeft, ArrowRight, AlertTriangle, BookOpenCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { updateGrammarProgress } from "@/actions/grammar";
import { Container } from "@/components/container";
import { ContentProgressForm } from "@/components/domains/content-progress-form";
import { DomainNavigation } from "@/components/domains/domain-navigation";
import { DomainPracticeLink } from "@/components/domains/practice-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import type { GrammarDetail } from "@/lib/domains/types";
import type { AppLocale } from "@/i18n/routing";

export async function GrammarDetailView({ data, locale }: { data: GrammarDetail; locale: AppLocale }) {
  const t = await getTranslations("domains.grammar.detail");
  const BackArrow = locale === "fa" ? ArrowRight : ArrowLeft;
  return <main className="flex flex-1 bg-muted/30 py-10 md:py-16"><Container><article className="mx-auto w-full max-w-4xl">
    <DomainNavigation /><Link href="/grammar" className="mt-8 inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground"><BackArrow aria-hidden className="size-4" />{t("back")}</Link>
    <header className="mt-6 border-b border-border/70 pb-8"><p className="text-label text-gold">{data.level ?? t("topic")}</p><h1 className="text-h1 mt-3">{localize(data.title, locale)}</h1><p className="text-body mt-4 text-muted-foreground">{localize(data.summary, locale)}</p></header>
    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="min-w-0 space-y-8">
      <section aria-labelledby="grammar-explanation"><h2 id="grammar-explanation" className="text-h2">{t("explanation")}</h2><p className="text-body mt-4 whitespace-pre-line">{localize(data.explanation, locale)}</p></section>
      {data.examples.length ? <section aria-labelledby="grammar-examples"><h2 id="grammar-examples" className="text-h2">{t("examples")}</h2><div className="mt-4 grid gap-3">{data.examples.map((example, index) => <div key={index} className="rounded-xl border border-border bg-card p-4"><p className="font-en text-body" dir="ltr">{example.sentence}</p>{example.translation ? <p className="text-body-sm mt-2 text-muted-foreground" dir="rtl">{example.translation}</p> : null}{example.note ? <p className="text-body-sm mt-2 text-gold">{localize(example.note, locale)}</p> : null}</div>)}</div></section> : null}
      {data.commonMistakes.length ? <section aria-labelledby="grammar-mistakes"><h2 id="grammar-mistakes" className="text-h2 flex items-center gap-2"><AlertTriangle aria-hidden className="size-5 text-gold" />{t("commonMistakes")}</h2><div className="mt-4 grid gap-3">{data.commonMistakes.map((mistake, index) => <div key={index} className="rounded-xl border border-border bg-card p-4"><p className="text-body-sm text-destructive">{localize(mistake.mistake, locale)}</p><p className="text-body-sm mt-2 text-success">{localize(mistake.correction, locale)}</p></div>)}</div></section> : null}
    </div><aside className="space-y-4 lg:sticky lg:top-24 lg:self-start"><Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck aria-hidden className="size-4" />{t("progressTitle")}</CardTitle></CardHeader><CardContent><ContentProgressForm contentId={data.id} currentState={data.state} action={updateGrammarProgress} namespace="grammar" /></CardContent></Card><DomainPracticeLink practiceSetId={data.practice?.practiceSetId ?? null} locale={locale} /></aside></div>
  </article></Container></main>;
}
