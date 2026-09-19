import Image from "next/image";
import type { Metadata } from "next";
import { Compass, HeartHandshake, Ruler } from "lucide-react";
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
      <section className="bg-card">
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-32">
          <div className="max-w-2xl">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">{t("eyebrow")}</p>
            <h1 className="text-display mt-5">{t("title")}</h1>
            <p className="text-body mt-6 text-muted-foreground">{t("description")}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-border shadow-raised">
            <Image
              src="/images/sayva-study-studio.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-primary/15 mix-blend-multiply" />
            <div className="absolute bottom-4 start-4 size-16 rounded-full border border-white/60 sm:bottom-6 sm:start-6 sm:size-20" />
          </div>
        </Container>
      </section>

      <section className="bg-background">
        <Container className="grid gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:py-28">
          <SectionIntro eyebrow="SAYVA" title={t("storyTitle")} />
          <p className="text-body max-w-2xl text-muted-foreground">{t("storyBody")}</p>
        </Container>
      </section>

      <section className="bg-muted/50">
        <Container className="py-20 lg:py-28">
          <SectionIntro eyebrow={t("valuesEyebrow")} title={t("identityTitle")} description={t("identityBody")} />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {values.map(({ key, icon: Icon }) => (
              <Card key={key} className="border-border/80 bg-card">
                <CardContent className="p-7">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <h2 className="text-h3 mt-10">{t(`values.${key}.title`)}</h2>
                  <p className="text-body-sm mt-3 text-muted-foreground">{t(`values.${key}.body`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-primary text-primary-foreground">
        <Container className="py-20 text-center sm:py-24 lg:py-28">
          <h2 className="text-h1 mx-auto max-w-2xl">{t("closingTitle")}</h2>
          <CtaLink href="/experience" locale={locale} variant="secondary" className="mt-8">
            {t("closingCta")}
          </CtaLink>
        </Container>
      </section>
    </main>
  );
}
