import Image from "next/image";
import type { Metadata } from "next";
import { Compass, Layers3, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/public/cta-link";
import { FeatureIcon } from "@/components/public/feature-icon";
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
  const t = await getTranslations({ locale, namespace: "features" });
  const title = t("metadataTitle");
  const description = t("metadataDescription");
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/features`,
      languages: { fa: "/fa/features", en: "/en/features" },
    },
    openGraph: { title, description, url: `/${locale}/features` },
    twitter: { title, description },
  };
}

/**
 * FEATURES — an asymmetric bento, not six identical boxes. Two image-led
 * panels carry the weight; four quiet panels keep the rhythm.
 */
export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "features" });

  const imageCards = {
    path: "/images/learning/study-desk.jpg",
    ai: "/images/speaking/friends-speaking.jpg",
  } as const;

  const itemCells = [
    { item: "path" as const, span: "md:col-span-4" },
    { item: "practice" as const, span: "md:col-span-2" },
    { item: "context" as const, span: "md:col-span-2" },
    { item: "ai" as const, span: "md:col-span-4" },
    { item: "bilingual" as const, span: "md:col-span-3" },
    { item: "calm" as const, span: "md:col-span-3" },
  ];

  return (
    <main>
      {/* ── Intro ────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b border-border/70 bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam" />
        <Container className="relative py-20 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <Reveal>
              <p className="text-caption mb-5 flex items-center gap-3 font-semibold uppercase tracking-[0.18em] text-gold">
                <span aria-hidden className="eyebrow-rule" />
                {t("eyebrow")}
              </p>
              <h1 className="text-display">{t("title")}</h1>
              <p className="text-body mt-6 max-w-2xl text-muted-foreground">{t("description")}</p>
              <div className="mt-9">
                <CtaLink href="/experience" locale={locale}>
                  {t("heroCta")}
                </CtaLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── Bento ────────────────────────────────────────────────────── */}
      <section className="bg-background">
        <Container className="py-16 lg:py-24">
          <Reveal className="max-w-2xl">
            <p className="text-caption mb-4 font-semibold uppercase tracking-[0.16em] text-gold">
              {t("gridEyebrow")}
            </p>
            <h2 className="text-h2">{t("gridTitle")}</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-6">
            <StaggerGroup className="contents" stagger={0.07}>
              {itemCells.map(({ item, span }, index) => {
                const withImage = item in imageCards;
                return (
                  <StaggerItem
                    key={item}
                    className={`${span} group relative overflow-hidden rounded-2xl border border-border/70 bg-card transition-shadow duration-300 hover:shadow-raised`}
                  >
                    {withImage ? (
                      <div className="relative h-44 overflow-hidden sm:h-48">
                        <Image
                          src={imageCards[item as keyof typeof imageCards]}
                          alt={t(`items.${item}.title`)}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent"
                        />
                      </div>
                    ) : null}
                    <div className={`${withImage ? "relative -mt-8" : "p-6 sm:p-7"} flex flex-col p-6 sm:p-7`}>
                      <div className="flex items-start justify-between gap-4">
                        <FeatureIcon name={item} />
                        <span className="font-en text-caption font-semibold tracking-[0.16em] text-muted-foreground">
                          0{index + 1}
                        </span>
                      </div>
                      <div className="mt-6">
                        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-gold">
                          {t(`items.${item}.tag`)}
                        </p>
                        <h2 className="text-h3 mt-1.5">{t(`items.${item}.title`)}</h2>
                        <p className="text-body-sm mt-2.5 text-muted-foreground">
                          {t(`items.${item}.body`)}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>
        </Container>
      </section>

      {/* ── Closing panel ────────────────────────────────────────────── */}
      <section className="border-t border-border/70 bg-muted/40">
        <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_0.7fr] lg:items-center lg:py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-deep p-8 text-deep-foreground shadow-raised sm:p-12">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam-deep" />
              <span aria-hidden className="eyebrow-rule relative mb-6" />
              <h2 className="text-h2 relative max-w-md text-deep-foreground">{t("closingTitle")}</h2>
              <p className="text-body-sm relative mt-4 max-w-md text-deep-muted">{t("closingBody")}</p>
              <CtaLink href="/experience" locale={locale} variant="onDeep" className="relative mt-8">
                {t("closingCta")}
              </CtaLink>
            </div>
          </Reveal>
          <StaggerGroup className="grid grid-cols-3 gap-3 sm:gap-5" stagger={0.1}>
            {[
              { icon: Compass, label: t("items.path.tag") },
              { icon: Layers3, label: t("items.context.tag") },
              { icon: MessageCircle, label: t("items.bilingual.tag") },
            ].map(({ icon: Icon, label }, index) => (
              <StaggerItem
                key={index}
                className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 text-center sm:p-6"
              >
                <span className="flex size-12 items-center justify-center rounded-full border border-gold/40 bg-accent text-accent-foreground sm:size-14">
                  <Icon aria-hidden className="size-5 sm:size-6" strokeWidth={1.5} />
                </span>
                <span className="text-caption text-muted-foreground">{label}</span>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>
    </main>
  );
}
