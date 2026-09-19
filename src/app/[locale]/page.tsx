import Image from "next/image";
import type { Metadata } from "next";
import { BookOpenCheck, Check, Compass, Layers3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { CtaLink } from "@/components/public/cta-link";
import { SectionIntro } from "@/components/public/section-intro";
import { Container } from "@/components/container";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { fa: "/fa", en: "/en" },
    },
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      images: [
        {
          url: "/images/hero/hero-learning-group.jpg",
          width: 1536,
          height: 1024,
          alt: t("heroAlt"),
        },
      ],
    },
    twitter: {
      title,
      description,
      images: ["/images/hero/hero-learning-group.jpg"],
    },
  };
}

/**
 * HOME — editorial composition, not a grid of boxes.
 *
 * Rhythm: deep hero (immersive) → quiet signal strip → method on card
 * surface → focus with the arch crop → full-bleed evening band → calm
 * closing. Every section changes its ground so the page breathes.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const focusPoints = t.raw("focusPoints") as string[];

  const signals = [
    { name: "path" as const, key: "clarity" },
    { name: "practice" as const, key: "practice" },
    { name: "context" as const, key: "context" },
  ];
  const steps = ["start", "build", "use"] as const;

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-deep text-deep-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam-deep" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <Container className="relative grid gap-14 py-16 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12 lg:py-24 xl:gap-20 xl:py-28">
          <StaggerGroup className="max-w-2xl" stagger={0.09}>
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
              <p className="text-body mt-6 max-w-xl text-deep-muted">{t("description")}</p>
            </StaggerItem>
            <StaggerItem>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <CtaLink href="/experience" locale={locale} variant="onDeep" size="lg">
                  {t("primaryCta")}
                </CtaLink>
                <CtaLink
                  href="/features"
                  locale={locale}
                  variant="ghost"
                  size="lg"
                  className="text-deep-foreground hover:bg-deep-foreground/10 hover:text-deep-foreground"
                >
                  {t("secondaryCta")}
                </CtaLink>
              </div>
            </StaggerItem>
          </StaggerGroup>

          <Reveal delay={0.15} className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ms-auto">
            {/* Offset hairline frame — the arch's echo, in line weight only. */}
            <div
              aria-hidden
              className="absolute -end-4 -top-4 hidden h-full w-full rounded-[1.75rem] border border-gold/40 sm:block"
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-deep-foreground/15 shadow-deep">
              <Image
                src="/images/hero/hero-learning-group.jpg"
                alt={t("heroAlt")}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-deep/35 via-transparent to-transparent"
              />
            </div>
            <div className="absolute -bottom-7 start-4 flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-card-foreground shadow-raised sm:start-6">
              <BrandLogo markClassName="size-7" wordClassName="text-xs" />
              <span aria-hidden className="h-8 w-px bg-border" />
              <div>
                <p className="text-caption font-semibold uppercase tracking-[0.14em] text-gold">
                  {t("heroLabel")}
                </p>
                <p className="text-body-sm mt-0.5 max-w-52">{t("heroCaption")}</p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Signals ──────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam" />
        <Container className="relative grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-24">
          <Reveal>
            <SectionIntro
              eyebrow={t("signalEyebrow")}
              title={t("signalTitle")}
              description={t("signalDescription")}
            />
          </Reveal>
          <StaggerGroup className="divide-y divide-border border-y border-border" stagger={0.1}>
            {signals.map((signal, index) => (
              <StaggerItem key={signal.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-5 py-7">
                <span className="flex size-11 items-center justify-center rounded-full border border-gold/40 bg-accent text-accent-foreground">
                  <FeatureIconDot name={signal.name} />
                </span>
                <div>
                  <h3 className="text-h3">{t(`signals.${signal.key}.title`)}</h3>
                  <p className="text-body-sm mt-1.5 max-w-md text-muted-foreground">
                    {t(`signals.${signal.key}.body`)}
                  </p>
                </div>
                <span className="font-en text-caption font-semibold tracking-[0.18em] text-gold">
                  0{index + 1}
                </span>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* ── Method ───────────────────────────────────────────────────── */}
      <section className="border-y border-border/70 bg-card">
        <Container className="grid gap-12 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:py-24">
          <Reveal>
            <SectionIntro
              eyebrow={t("methodEyebrow")}
              title={t("methodTitle")}
              description={t("methodDescription")}
            />
          </Reveal>
          <StaggerGroup className="grid gap-10 sm:grid-cols-3 sm:gap-8" stagger={0.12}>
            {steps.map((step) => (
              <StaggerItem key={step} className="border-t-2 border-gold/70 pt-5">
                <span className="font-en block text-4xl font-extrabold tracking-tight text-gold/35">
                  {t(`steps.${step}.number`)}
                </span>
                <h3 className="text-h3 mt-4">{t(`steps.${step}.title`)}</h3>
                <p className="text-body-sm mt-2.5 text-muted-foreground">
                  {t(`steps.${step}.body`)}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* ── Focus ────────────────────────────────────────────────────── */}
      <section className="bg-background">
        <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-20 lg:py-24">
          <div>
            <Reveal>
              <p className="text-caption mb-4 font-semibold uppercase tracking-[0.16em] text-gold">
                {t("focusEyebrow")}
              </p>
              <h2 className="text-h1 max-w-xl">{t("focusTitle")}</h2>
              <p className="text-body mt-5 max-w-xl text-muted-foreground">{t("focusBody")}</p>
            </Reveal>
            <ul className="mt-8 flex flex-col gap-4">
              {focusPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-body-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
                    <Check aria-hidden className="size-3" strokeWidth={3} />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <Reveal delay={0.1} className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-t-full rounded-b-[1.75rem] border border-gold/35 sm:-inset-4"
            />
            <div className="arch-crop relative aspect-[4/5] overflow-hidden border border-border/70 shadow-raised">
              <Image
                src="/images/practice/vocabulary-notebook.jpg"
                alt={t("focusCardTitle")}
                fill
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="object-cover object-center"
              />
            </div>
            <div className="mt-6 rounded-xl border border-border/70 bg-card p-5 sm:mt-8">
              <p className="text-caption font-semibold uppercase tracking-[0.14em] text-gold">
                {t("focusCardLabel")}
              </p>
              <p className="text-h3 mt-2">{t("focusCardTitle")}</p>
              <p className="text-body-sm mt-1.5 text-muted-foreground">{t("focusCardBody")}</p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── AI band — full-bleed evening ─────────────────────────────── */}
      <section className="relative isolate flex min-h-[26rem] items-center overflow-hidden bg-deep lg:min-h-[30rem]">
        <Image
          src="/images/community/study-circle.jpg"
          alt={t("aiTitle")}
          fill
          sizes="100vw"
          className="object-cover object-center opacity-60"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-deep via-deep/78 to-deep/40 rtl:bg-gradient-to-l"
        />
        <Container className="relative py-16 lg:py-20">
          <div className="max-w-xl">
            <Reveal>
              <p className="text-caption mb-4 flex items-center gap-3 font-semibold uppercase tracking-[0.18em] text-gold">
                <span aria-hidden className="eyebrow-rule" />
                {t("aiEyebrow")}
              </p>
              <h2 className="text-h1 text-deep-foreground">{t("aiTitle")}</h2>
              <p className="text-body mt-5 text-deep-muted">{t("aiBody")}</p>
              <CtaLink href="/features" locale={locale} variant="onDeep" className="mt-8">
                {t("aiCta")}
              </CtaLink>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── Closing ──────────────────────────────────────────────────── */}
      <section className="bg-background">
        <Container className="py-20 text-center sm:py-24 lg:py-32">
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">
              {t("closingEyebrow")}
            </p>
            <h2 className="text-h1 mt-5">{t("closingTitle")}</h2>
            <p className="text-body mt-5 max-w-xl text-muted-foreground">{t("closingBody")}</p>
            <div className="mt-9">
              <CtaLink href="/experience" locale={locale} size="lg">
                {t("closingCta")}
              </CtaLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}

/** Small gold-accented icon set for the signal strip (lucide only). */
const signalIcons = {
  path: Compass,
  practice: BookOpenCheck,
  context: Layers3,
} as const;

function FeatureIconDot({ name }: { name: keyof typeof signalIcons }) {
  const Icon = signalIcons[name];
  return <Icon aria-hidden className="size-5" strokeWidth={1.75} />;
}
