import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/public/cta-link";
import { Container } from "@/components/container";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const title = t("metadataTitle");
  const description = t("metadataDescription");
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/faq`,
      languages: { fa: "/fa/faq", en: "/en/faq" },
    },
    openGraph: { title, description, url: `/${locale}/faq` },
    twitter: { title, description },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const items = ["what", "who", "ai", "bilingual", "method", "start"] as const;

  return (
    <main>
      <section className="bg-card">
        <Container className="py-20 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold">{t("eyebrow")}</p>
            <h1 className="text-display mt-5">{t("title")}</h1>
            <p className="text-body mt-6 max-w-2xl text-muted-foreground">{t("description")}</p>
          </div>
        </Container>
      </section>

      <section className="bg-background">
        <Container className="max-w-4xl py-16 sm:py-20 lg:py-24">
          <div className="divide-y divide-border border-y border-border">
            {items.map((item, index) => (
              <details key={item} className="group py-6 sm:py-7" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-start marker:hidden [&::-webkit-details-marker]:hidden">
                  <h2 className="text-h3">{t(`items.${item}.question`)}</h2>
                  <ChevronDown aria-hidden className="size-5 shrink-0 text-gold transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-body-sm mt-4 max-w-3xl pe-8 text-muted-foreground">{t(`items.${item}.answer`)}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-muted/50">
        <Container className="py-20 text-center sm:py-24">
          <h2 className="text-h2">{t("ctaTitle")}</h2>
          <p className="text-body mx-auto mt-4 max-w-xl text-muted-foreground">{t("ctaBody")}</p>
          <CtaLink href="/experience" locale={locale} className="mt-8">
            {t("cta")}
          </CtaLink>
        </Container>
      </section>
    </main>
  );
}
