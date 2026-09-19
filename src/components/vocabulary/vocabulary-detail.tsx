import { ArrowLeft, ArrowRight, Headphones, Languages } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { VocabularyStateForm } from "@/components/domains/vocabulary-state-form";
import { DomainNavigation } from "@/components/domains/domain-navigation";
import { DomainPracticeLink } from "@/components/domains/practice-link";
import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import type { VocabularyDetail } from "@/lib/domains/types";
import type { AppLocale } from "@/i18n/routing";

export async function VocabularyDetailView({ data, locale }: { data: VocabularyDetail; locale: AppLocale }) {
  const t = await getTranslations("domains.vocabulary.detail");
  const BackArrow = locale === "fa" ? ArrowRight : ArrowLeft;
  return (
    <main className="flex flex-1 bg-muted/30 py-10 md:py-16">
      <Container>
        <article className="mx-auto w-full max-w-4xl">
          <DomainNavigation />
          <Link href="/vocabulary" className="mt-8 inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground">
            <BackArrow aria-hidden className="size-4" />{t("back")}
          </Link>
          <header className="mt-6 border-b border-border/70 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              {data.level ? <span className="text-label text-gold">{data.level}</span> : null}
              {data.partOfSpeech ? <span className="text-caption rounded-full bg-muted px-3 py-1">{data.partOfSpeech}</span> : null}
            </div>
            <h1 className="font-en text-5xl font-bold tracking-tight mt-4">{data.word}</h1>
            <p className="text-body mt-4 text-muted-foreground">{localize(data.translation, locale)}</p>
          </header>
          <div className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-8">
              <section aria-labelledby="vocabulary-definition">
                <h2 id="vocabulary-definition" className="text-h2">{t("definition")}</h2>
                <p className="text-body mt-3 whitespace-pre-line">{localize(data.definition, locale)}</p>
              </section>
              {data.examples.length ? (
                <section aria-labelledby="vocabulary-examples">
                  <h2 id="vocabulary-examples" className="text-h2">{t("examples")}</h2>
                  <div className="mt-4 grid gap-3">
                    {data.examples.map((example, index) => (
                      <div key={index} className="rounded-xl border border-border bg-card p-4">
                        <p className="font-en text-body" dir="ltr">{example.sentence}</p>
                        {example.translation ? <p className="text-body-sm mt-2 text-muted-foreground" dir="rtl">{example.translation}</p> : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardHeader><CardTitle>{t("stateTitle")}</CardTitle></CardHeader>
                <CardContent><VocabularyStateForm itemId={data.id} currentState={data.state} /></CardContent>
              </Card>
              {data.pronunciation ? (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Languages aria-hidden className="size-4" />{t("pronunciation")}</CardTitle></CardHeader>
                  <CardContent className="grid gap-3">
                    {data.pronunciation.ipa ? <p className="font-en text-lg" dir="ltr">{data.pronunciation.ipa}</p> : null}
                    {data.pronunciation.audioSrc ? <a href={data.pronunciation.audioSrc} className="inline-flex items-center gap-2 text-body-sm text-primary hover:underline"><Headphones aria-hidden />{t("audio")}</a> : null}
                  </CardContent>
                </Card>
              ) : null}
              <DomainPracticeLink practiceSetId={data.practice?.practiceSetId ?? null} locale={locale} />
            </aside>
          </div>
        </article>
      </Container>
    </main>
  );
}
