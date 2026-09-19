import type { Metadata } from "next";
import { BrainCircuit, Compass, Layers3, Sparkles } from "lucide-react";
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

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "features" });
  const items = ["path", "practice", "context", "ai", "bilingual", "calm"] as const;
  const icons = ["path", "practice", "context", "ai", "bilingual", "calm"] as const;

  return (
    <main>
      <section className="relative overflow-hidden border-b bg-card">
        <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full border border-gold/30" />
        <div aria-hidden className="pointer-events-none absolute -end-12 -top-12 size-48 rounded-full border border-gold/20" />
        <Container className="relative py-20 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">{t("eyebrow")}</p>
            <h1 className="text-display mt-5">{t("title")}</h1>
            <p className="text-body mt-6 max-w-2xl text-muted-foreground">{t("description")}</p>
            <CtaLink href="/experience" locale={locale} className="mt-8">
              {t("heroCta")}
            </CtaLink>
          </div>
        </Container>
      </section>

      <section className="bg-background">
        <Container className="py-20 lg:py-28">
          <SectionIntro eyebrow={t("gridEyebrow")} title={t("gridTitle")} />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <Card key={item} className="group min-h-64 border-border/80 bg-card transition-all hover:-translate-y-1 hover:shadow-raised">
                <CardContent className="flex h-full flex-col p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <FeatureIcon name={icons[index]} />
                    <span className="font-en text-caption font-semibold tracking-[0.16em] text-muted-foreground">0{index + 1}</span>
                  </div>
                  <div className="mt-auto pt-12">
                    <p className="text-caption mb-2 font-semibold uppercase tracking-[0.12em] text-gold">{t(`items.${item}.tag`)}</p>
                    <h2 className="text-h3">{t(`items.${item}.title`)}</h2>
                    <p className="text-body-sm mt-3 text-muted-foreground">{t(`items.${item}.body`)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-muted/50">
        <Container className="grid gap-10 py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-28">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-primary p-8 text-primary-foreground shadow-raised sm:p-12">
            <div aria-hidden className="absolute -end-16 -top-16 size-48 rounded-full border border-gold/30" />
            <div aria-hidden className="absolute -end-6 -top-6 size-28 rounded-full border border-gold/20" />
            <Sparkles aria-hidden className="relative size-8 text-gold" />
            <h2 className="text-h2 relative mt-16 max-w-md">{t("closingTitle")}</h2>
            <p className="text-body-sm relative mt-4 max-w-md text-primary-foreground/75">{t("closingBody")}</p>
            <CtaLink href="/experience" locale={locale} variant="secondary" className="relative mt-8">
              {t("closingCta")}
            </CtaLink>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center sm:gap-5">
            {[Compass, Layers3, BrainCircuit].map((Icon, index) => (
              <div key={index} className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-border bg-card p-3 sm:p-5">
                <Icon aria-hidden className="size-6 text-gold sm:size-7" strokeWidth={1.5} />
                <span className="font-en text-caption mt-4 text-muted-foreground">0{index + 1}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
