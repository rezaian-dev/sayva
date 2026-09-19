import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/public/cta-link";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { Container } from "@/components/container";
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

/**
 * EXPERIENCE — the philosophy page. Deep intro, numbered principles as an
 * editorial list (no boxes), the dusk arch as the quiet centerpiece, then
 * the closing quote.
 */
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "experience" });
  const rhythmPoints = t.raw("rhythmPoints") as string[];
  const principles = ["notice", "practice", "speak"] as const;

  return (
    <main>
      {/* ── Intro ────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-deep text-deep-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam-deep" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <Container className="relative py-20 sm:py-24 lg:py-28">
          <StaggerGroup className="max-w-3xl" stagger={0.09}>
            <StaggerItem>
              <p className="text-caption mb-5 flex items-center gap-3 font-semibold uppercase tracking-[0.18em] text-gold">
                <span aria-hidden className="eyebrow-rule" />
                {t("eyebrow")}
              </p>
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-display text-deep-foreground">{t("title")}</h1>
            </StaggerItem>
            <StaggerItem>
              <p className="text-body mt-6 max-w-2xl text-deep-muted">{t("description")}</p>
            </StaggerItem>
            <StaggerItem>
              <div className="mt-9">
                <CtaLink href="/features" locale={locale} variant="onDeep">
                  {t("primaryCta")}
                </CtaLink>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </Container>
      </section>

      {/* ── Principles ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam" />
        <Container className="relative py-16 lg:py-24">
          <Reveal className="max-w-2xl">
            <p className="text-caption mb-4 font-semibold uppercase tracking-[0.16em] text-gold">
              {t("principlesEyebrow")}
            </p>
            <h2 className="text-h1">{t("principlesTitle")}</h2>
          </Reveal>
          <StaggerGroup className="mt-12 grid gap-10 border-y border-border divide-y divide-border lg:grid-cols-3 lg:gap-8 lg:divide-y-0" stagger={0.12}>
            {principles.map((key) => (
              <StaggerItem key={key} className="border-t-2 border-gold/70 pt-5 lg:border-t-0 lg:border-t-2 lg:pt-5">
                <span className="font-en block text-4xl font-extrabold tracking-tight text-gold/35">
                  {t(`principles.${key}.number`)}
                </span>
                <h3 className="text-h2 mt-4">{t(`principles.${key}.title`)}</h3>
                <p className="text-body-sm mt-3 text-muted-foreground">
                  {t(`principles.${key}.body`)}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* ── Rhythm — the dusk arch ───────────────────────────────────── */}
      <section className="border-y border-border/70 bg-card">
        <Container className="grid gap-12 py-16 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:gap-20 lg:py-24">
          <Reveal delay={0.08} className="relative mx-auto w-full max-w-sm lg:max-w-md">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-t-full rounded-b-[1.75rem] border border-gold/35 sm:-inset-4"
            />
            <div className="arch-crop relative aspect-[4/5] overflow-hidden border border-border/70 shadow-raised">
              <Image
                src="/images/editorial/city-dusk.jpg"
                alt={t("rhythmTitle")}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="text-caption mb-4 font-semibold uppercase tracking-[0.16em] text-gold">
                {t("rhythmEyebrow")}
              </p>
              <h2 className="text-h1 max-w-xl">{t("rhythmTitle")}</h2>
              <p className="text-body mt-5 max-w-xl text-muted-foreground">{t("rhythmBody")}</p>
            </Reveal>
            <ul className="mt-8 flex flex-col gap-4">
              {rhythmPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-body-sm">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* ── Closing quote ────────────────────────────────────────────── */}
      <section className="bg-background">
        <Container className="py-20 text-center sm:py-24 lg:py-28">
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center">
            <blockquote className="text-h2 text-primary dark:text-foreground">
              “{t("quote")}”
            </blockquote>
            <span aria-hidden className="mt-8 h-px w-12 bg-gold" />
            <h2 className="text-h2 mt-14">{t("closingTitle")}</h2>
            <p className="text-body mx-auto mt-4 max-w-xl text-muted-foreground">
              {t("closingBody")}
            </p>
            <div className="mt-9">
              <CtaLink href="/features" locale={locale}>
                {t("closingCta")}
              </CtaLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
