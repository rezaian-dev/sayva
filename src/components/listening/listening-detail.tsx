import { ArrowLeft, ArrowRight, BookAudio } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { updateListeningProgress } from "@/actions/listening";
import { Container } from "@/components/container";
import { ContentProgressForm } from "@/components/domains/content-progress-form";
import { DomainNavigation } from "@/components/domains/domain-navigation";
import { DomainPracticeLink } from "@/components/domains/practice-link";
import { ListeningAudioPlayer } from "@/components/listening/audio-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import type { ListeningDetail } from "@/lib/domains/types";
import type { AppLocale } from "@/i18n/routing";

export async function ListeningDetailView({ data, locale }: { data: ListeningDetail; locale: AppLocale }) {
  const t = await getTranslations("domains.listening.detail");
  const BackArrow = locale === "fa" ? ArrowRight : ArrowLeft;
  return <main className="flex flex-1 bg-muted/30 py-10 md:py-16"><Container><article className="mx-auto w-full max-w-4xl">
    <DomainNavigation /><Link href="/listening" className="mt-8 inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground"><BackArrow aria-hidden className="size-4" />{t("back")}</Link>
    <header className="mt-6 border-b border-border/70 pb-8"><p className="text-label text-gold">{data.level ?? t("lesson")}</p><h1 className="text-h1 mt-3">{localize(data.title, locale)}</h1><p className="text-body mt-4 text-muted-foreground">{localize(data.description, locale)}</p></header>
    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="min-w-0 space-y-6"><ListeningAudioPlayer src={data.audioSrc} title={localize(data.title, locale)} />
      {data.transcript && data.transcriptVisibility !== "hidden" ? <section aria-labelledby="listening-transcript" className="rounded-xl border border-border bg-card p-5">{data.transcriptVisibility === "on-request" ? <details><summary className="cursor-pointer font-medium">{t("showTranscript")}</summary><p id="listening-transcript" className="text-body mt-4 whitespace-pre-line">{localize(data.transcript, locale)}</p></details> : <><h2 id="listening-transcript" className="text-h2">{t("transcript")}</h2><p className="text-body mt-4 whitespace-pre-line">{localize(data.transcript, locale)}</p></>}</section> : null}
    </div><aside className="space-y-4 lg:sticky lg:top-24 lg:self-start"><Card><CardHeader><CardTitle className="flex items-center gap-2"><BookAudio aria-hidden className="size-4" />{t("progressTitle")}</CardTitle></CardHeader><CardContent><ContentProgressForm contentId={data.id} currentState={data.state} action={updateListeningProgress} namespace="listening" /></CardContent></Card><DomainPracticeLink practiceSetId={data.practice?.practiceSetId ?? null} locale={locale} /></aside></div>
  </article></Container></main>;
}
