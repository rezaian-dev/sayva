import { ArrowLeft, ArrowRight, BookOpenCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { updateReadingProgress } from "@/actions/reading";
import { Container } from "@/components/container";
import { ContentProgressForm } from "@/components/domains/content-progress-form";
import { DomainNavigation } from "@/components/domains/domain-navigation";
import { DomainPracticeLink } from "@/components/domains/practice-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import type { ReadingDetail } from "@/lib/domains/types";
import type { AppLocale } from "@/i18n/routing";

export async function ReadingDetailView({ data, locale }: { data: ReadingDetail; locale: AppLocale }) {
  const t = await getTranslations("domains.reading.detail");
  const BackArrow = locale === "fa" ? ArrowRight : ArrowLeft;
  return <main className="flex flex-1 bg-muted/30 py-10 md:py-16"><Container><article className="mx-auto w-full max-w-5xl">
    <DomainNavigation /><Link href="/reading" className="mt-8 inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground"><BackArrow aria-hidden className="size-4" />{t("back")}</Link>
    <header className="mx-auto mt-6 max-w-3xl border-b border-border/70 pb-8"><p className="text-label text-gold">{data.level ?? t("reading")}</p><h1 className="text-h1 mt-3">{localize(data.title, locale)}</h1><p className="text-body mt-4 text-muted-foreground">{localize(data.summary, locale)}</p></header>
    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]"><article className="min-w-0 max-w-3xl space-y-10" aria-label={t("contentLabel")}>
      {data.sections.map((section, index) => <section key={index} aria-labelledby={`reading-section-${index}`}>{section.heading ? <h2 id={`reading-section-${index}`} className="text-h2">{localize(section.heading, locale)}</h2> : null}<div className="mt-4 space-y-5">{section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="text-body leading-8 whitespace-pre-line">{localize(paragraph, locale)}</p>)}</div></section>)}
    </article><aside className="space-y-4 lg:sticky lg:top-24 lg:self-start"><Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck aria-hidden className="size-4" />{t("progressTitle")}</CardTitle></CardHeader><CardContent><ContentProgressForm contentId={data.id} currentState={data.state} action={updateReadingProgress} namespace="reading" /></CardContent></Card><DomainPracticeLink practiceSetId={data.practice?.practiceSetId ?? null} locale={locale} /></aside></div>
  </article></Container></main>;
}
