import Image from "next/image";
import type { Metadata } from "next";
import { Compass, HeartHandshake, Ruler } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/public/cta-link";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { SectionIntro } from "@/components/public/section-intro";
import { Container } from "@/components/container";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("metadataTitle");
  const description = t("metadataDescription");
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/about`,
      languages: { fa: "/fa/about", en: "/en/about" },
    },
    openGraph: { title, description, url: `/${locale}/about` },
    twitter: { title, description },
  };
}

/**
 * ABOUT — the story of the product. An image-led opening, a quiet
 * editorial statement, and the values as a hairline list.
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const values = [
    { key: "clarity", icon: Compass },
    { key: "human", icon: HeartHandshake },
    { key: "craft", icon: Ruler },
  ] as const;

  return (
    <main>
      {/* ── Opening ──────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam" />
        <Container className="relative grid gap-12 py-16 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-20 lg:py-24">
          <StaggerGroup className="max-w-2xl" stagger={0.09}>
            <StaggerItem>
              <p className="text-caption mb-5 flex items-center gap-3 font-semibold uppercase tracking-[0.18em] text-gold">
                <span aria-hidden className="eyebrow-rule" />
                {t("eyebrow")}
              </p>
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-display">{t("title")}</h1>
            </StaggerItem>
            <StaggerItem>
              <p className="text-body mt-6 text-muted-foreground">{t("description")}</p>
            </StaggerItem>
          </StaggerGroup>
          <Reveal delay={0.12} className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden
              className="absolute -end-4 -top-4 hidden h-full w-full rounded-[1.75rem] border border-gold/40 sm:block"
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-border/70 shadow-raised">
              <Image
                src="/images/auth/quiet-room.jpg"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-center"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Story ────────────────────────────────────────────────────── */}
      <section className="border-y border-border/70 bg-card">
        <Container className="grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:py-24">
          <Reveal>
            <SectionIntro eyebrow="SAYVA" title={t("storyTitle")} />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="border-s-2 border-gold/70 ps-6 text-body max-w-2xl text-muted-foreground">
              {t("storyBody")}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── Values ───────────────────────────────────────────────────── */}
      <section className="bg-background">
        <Container className="py-16 lg:py-24">
          <Reveal className="max-w-2xl">
            <SectionIntro
              eyebrow={t("valuesEyebrow")}
              title={t("identityTitle")}
              description={t("identityBody")}
            />
          </Reveal>
          <StaggerGroup className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-3" stagger={0.12}>
            {values.map(({ key, icon: Icon }) => (
              <StaggerItem key={key} className="border-t-2 border-gold/70 pt-5">
                <span className="flex size-11 items-center justify-center rounded-full border border-gold/40 bg-accent text-accent-foreground">
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <h2 className="text-h3 mt-5">{t(`values.${key}.title`)}</h2>
                <p className="text-body-sm mt-2.5 text-muted-foreground">{t(`values.${key}.body`)}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* ── Closing ──────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-deep text-deep-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam-deep" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <Container className="relative py-20 text-center sm:py-24 lg:py-28">
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center">
            <h2 className="text-h1 text-deep-foreground">{t("closingTitle")}</h2>
            <div className="mt-9">
              <CtaLink href="/experience" locale={locale} variant="onDeep">
                {t("closingCta")}
              </CtaLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
