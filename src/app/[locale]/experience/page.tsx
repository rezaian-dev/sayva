import type { Metadata } from "next";
import { BookOpenCheck, MessageCircle, Repeat2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/public/cta-link";
import { SectionIntro } from "@/components/public/section-intro";
import { Container } from "@/components/container";
import { Card, CardContent } from "@/components/ui/card";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "experience" });
  const title = t("metadataTitle");
  const description = t("metadataDescription");
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/experience`,
      languages: { fa: "/fa/experience", en: "/en/experience" },
    },
    openGraph: { title, description, url: `/${locale}/experience` },
    twitter: { title, description },
  };
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "experience" });
  const principles = [
    { key: "notice", icon: BookOpenCheck },
    { key: "practice", icon: Repeat2 },
    { key: "speak", icon: MessageCircle },
  ] as const;
  const rhythmPoints = t.raw("rhythmPoints") as string[];

  return (
    <main>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-1/2 opacity-30 [background-image:linear-gradient(135deg,transparent_48%,color-mix(in_oklab,var(--gold)_55%,transparent)_49%,transparent_50%)] [background-size:2.5rem_2.5rem]" />
        <Container className="relative py-20 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">{t("eyebrow")}</p>
            <h1 className="text-display mt-5">{t("title")}</h1>
            <p className="text-body mt-6 max-w-2xl text-primary-foreground/75">{t("description")}</p>
            <CtaLink href="/features" locale={locale} variant="secondary" className="mt-8">
              {t("primaryCta")}
            </CtaLink>
          </div>
        </Container>
      </section>

      <section className="bg-background">
        <Container className="py-20 lg:py-28">
          <SectionIntro eyebrow="SAYVA" title={t("principlesTitle")} />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {principles.map(({ key, icon: Icon }) => (
              <Card key={key} className="border-border/80 bg-card">
                <CardContent className="p-7 sm:p-9">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="font-en text-caption font-semibold tracking-[0.18em] text-gold">{t(`principles.${key}.number`)}</span>
                  </div>
                  <h2 className="text-h2 mt-16">{t(`principles.${key}.title`)}</h2>
                  <p className="text-body-sm mt-4 text-muted-foreground">{t(`principles.${key}.body`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-card">
        <Container className="grid gap-12 py-20 lg:grid-cols-[0.8fr_1fr] lg:items-center lg:py-28">
          <div className="relative aspect-square max-w-md overflow-hidden rounded-[2rem] border border-border bg-muted p-6 sm:p-10">
            <div aria-hidden className="absolute inset-6 rounded-[1.5rem] border border-gold/35 sm:inset-10" />
            <div aria-hidden className="absolute inset-14 rounded-[1rem] border border-primary/15 sm:inset-20" />
            <div className="relative flex h-full flex-col justify-between rounded-[1rem] bg-background p-5 shadow-soft sm:p-7">
              <div className="flex items-center justify-between">
                <span className="text-caption uppercase tracking-[0.16em] text-gold">SAYVA</span>
                <span className="size-2 rounded-full bg-success" />
              </div>
              <div className="flex items-center justify-center">
                <div className="flex size-24 items-center justify-center rounded-full border border-gold/50 bg-accent sm:size-32">
                  <Repeat2 aria-hidden className="size-9 text-accent-foreground sm:size-11" strokeWidth={1.3} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-2/3 rounded-full bg-primary/15" />
                <div className="h-2 w-1/2 rounded-full bg-primary/10" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">{t("rhythmEyebrow")}</p>
            <h2 className="text-h1 mt-4 max-w-xl">{t("rhythmTitle")}</h2>
            <p className="text-body mt-5 max-w-xl text-muted-foreground">{t("rhythmBody")}</p>
            <ul className="mt-7 flex flex-col gap-4">
              {rhythmPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-body-sm">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="bg-background">
        <Container className="py-20 text-center sm:py-24 lg:py-28">
          <blockquote className="text-h2 mx-auto max-w-2xl text-primary">“{t("quote")}”</blockquote>
          <div className="mx-auto mt-8 h-px w-12 bg-gold" />
          <h2 className="text-h2 mt-16">{t("closingTitle")}</h2>
          <p className="text-body mx-auto mt-4 max-w-xl text-muted-foreground">{t("closingBody")}</p>
          <CtaLink href="/features" locale={locale} className="mt-8">
            {t("closingCta")}
          </CtaLink>
        </Container>
      </section>
    </main>
  );
}
