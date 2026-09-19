import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpLeft, ArrowUpRight, BrainCircuit, Check, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/public/cta-link";
import { FeatureIcon } from "@/components/public/feature-icon";
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
      images: [{ url: "/images/sayva-study-studio.jpg", width: 1200, height: 896, alt: t("heroAlt") }],
    },
    twitter: {
      title,
      description,
      images: ["/images/sayva-study-studio.jpg"],
    },
  };
}

function DirectionalCircleArrow({ locale }: { locale: AppLocale }) {
  const Icon = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  return <Icon aria-hidden className="size-5" />;
}

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
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--primary-foreground)_14%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-foreground)_14%,transparent)_1px,transparent_1px)] [background-size:4rem_4rem]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -start-32 top-20 size-80 rounded-full bg-gold/20 blur-3xl"
        />
        <Container className="relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-caption mb-5 font-semibold uppercase tracking-[0.18em] text-gold">
              {t("eyebrow")}
            </p>
            <h1 className="text-display max-w-2xl text-primary-foreground">
              {t("title")}
            </h1>
            <p className="text-body mt-6 max-w-xl text-primary-foreground/75">
              {t("description")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaLink href="/experience" locale={locale} variant="secondary" size="lg">
                {t("primaryCta")}
              </CtaLink>
              <CtaLink
                href="/features"
                locale={locale}
                variant="ghost"
                size="lg"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {t("secondaryCta")}
              </CtaLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ms-auto">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-[2rem] border border-primary-foreground/15"
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-primary-foreground/20 bg-primary-foreground/10 shadow-raised">
              <Image
                src="/images/sayva-study-studio.jpg"
                alt={t("heroAlt")}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-2xl border border-white/30 bg-primary/80 p-4 backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-5">
                <div>
                  <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">
                    {t("heroLabel")}
                  </p>
                  <p className="text-body-sm mt-1 text-primary-foreground/90">
                    {t("heroCaption")}
                  </p>
                </div>
                <DirectionalCircleArrow locale={locale} />
              </div>
            </div>
            <div className="absolute -end-5 -top-5 hidden size-20 rounded-full border border-gold/60 bg-primary p-2 sm:block">
              <div className="flex size-full items-center justify-center rounded-full border border-gold/30 text-gold">
                <Sparkles aria-hidden className="size-5" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b bg-background">
        <Container className="grid gap-8 py-10 md:grid-cols-3 md:gap-10 md:py-14">
          <div className="md:col-span-3 md:max-w-2xl">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">
              {t("signalEyebrow")}
            </p>
            <h2 className="text-h1 mt-3">{t("signalTitle")}</h2>
            <p className="text-body mt-4 text-muted-foreground">{t("signalDescription")}</p>
          </div>
          {signals.map((signal) => (
            <div key={signal.key} className="flex gap-4">
              <FeatureIcon name={signal.name} />
              <div>
                <h3 className="text-h3">{t(`signals.${signal.key}.title`)}</h3>
                <p className="text-body-sm mt-2 text-muted-foreground">
                  {t(`signals.${signal.key}.body`)}
                </p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <section className="bg-card">
        <Container className="grid gap-12 py-20 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:py-28">
          <SectionIntro
            eyebrow={t("methodEyebrow")}
            title={t("methodTitle")}
            description={t("methodDescription")}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <Card key={step} className="group border-border/80 bg-background transition-transform hover:-translate-y-1">
                <CardContent className="p-6 sm:p-7">
                  <span className="font-en text-caption font-semibold tracking-[0.18em] text-gold">
                    {t(`steps.${step}.number`)}
                  </span>
                  <h3 className="text-h3 mt-12">{t(`steps.${step}.title`)}</h3>
                  <p className="text-body-sm mt-3 text-muted-foreground">
                    {t(`steps.${step}.body`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="overflow-hidden bg-muted/50">
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">
              {t("focusEyebrow")}
            </p>
            <h2 className="text-h1 mt-4 max-w-xl">{t("focusTitle")}</h2>
            <p className="text-body mt-5 max-w-xl text-muted-foreground">{t("focusBody")}</p>
            <ul className="mt-7 flex flex-col gap-4">
              {focusPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-body-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground">
                    <Check aria-hidden className="size-3" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div aria-hidden className="absolute -inset-5 rounded-[2rem] border border-gold/30" />
            <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 shadow-raised sm:p-7">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <span className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">
                  {t("focusCardLabel")}
                </span>
                <span aria-hidden className="size-2 rounded-full bg-success" />
              </div>
              <div className="py-10">
                <div className="mb-6 h-2 w-20 rounded-full bg-gold/60" />
                <div className="space-y-3">
                  <div className="h-4 w-11/12 rounded bg-primary/15" />
                  <div className="h-4 w-4/5 rounded bg-primary/10" />
                  <div className="h-4 w-3/5 rounded bg-primary/10" />
                </div>
                <div className="mt-10 rounded-xl bg-accent p-4">
                  <p className="text-h3">{t("focusCardTitle")}</p>
                  <p className="text-body-sm mt-2 text-muted-foreground">{t("focusCardBody")}</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-primary text-primary-foreground">
        <Container className="grid gap-10 py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-28">
          <div className="max-w-2xl">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">
              {t("aiEyebrow")}
            </p>
            <h2 className="text-h1 mt-4">{t("aiTitle")}</h2>
            <p className="text-body mt-5 text-primary-foreground/75">{t("aiBody")}</p>
            <CtaLink href="/features" locale={locale} variant="secondary" className="mt-8">
              {t("aiCta")}
            </CtaLink>
          </div>
          <div className="flex justify-start lg:justify-end">
            <div className="flex size-44 items-center justify-center rounded-full border border-gold/50 bg-primary-foreground/5 sm:size-56">
              <div className="flex size-28 items-center justify-center rounded-full border border-primary-foreground/20 sm:size-36">
                <BrainCircuit aria-hidden className="size-14 text-gold sm:size-16" strokeWidth={1.2} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-background">
        <Container className="py-20 text-center sm:py-24 lg:py-32">
          <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">
            {t("closingEyebrow")}
          </p>
          <h2 className="text-h1 mx-auto mt-4 max-w-2xl">{t("closingTitle")}</h2>
          <p className="text-body mx-auto mt-5 max-w-xl text-muted-foreground">{t("closingBody")}</p>
          <CtaLink href="/experience" locale={locale} size="lg" className="mt-8">
            {t("closingCta")}
          </CtaLink>
        </Container>
      </section>
    </main>
  );
}
