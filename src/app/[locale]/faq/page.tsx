import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/public/cta-link";
import { Reveal } from "@/components/motion/reveal";
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

/**
 * FAQ — calm, numbered, hairline-divided. The details element keeps the
 * interaction fully accessible with zero client JavaScript.
 */
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
      <section className="relative isolate overflow-hidden border-b border-border/70 bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam" />
        <Container className="relative py-20 sm:py-24 lg:py-28">
          <Reveal className="max-w-3xl">
            <p className="text-caption mb-5 flex items-center gap-3 font-semibold uppercase tracking-[0.18em] text-gold">
              <span aria-hidden className="eyebrow-rule" />
              {t("eyebrow")}
            </p>
            <h1 className="text-display">{t("title")}</h1>
            <p className="text-body mt-6 max-w-2xl text-muted-foreground">{t("description")}</p>
          </Reveal>
        </Container>
      </section>

      <section className="bg-background">
        <Container className="max-w-4xl py-14 sm:py-16 lg:py-20">
          <div className="divide-y divide-border border-y border-border">
            {items.map((item, index) => (
              <details key={item} className="group" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center gap-4 py-6 transition-colors duration-200 hover:text-primary sm:py-7 dark:hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="font-en text-caption w-8 shrink-0 font-semibold tracking-[0.16em] text-gold">
                    0{index + 1}
                  </span>
                  <span className="text-h3 flex-1">{t(`items.${item}.question`)}</span>
                  <ChevronDown
                    aria-hidden
                    className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out group-open:rotate-180"
                  />
                </summary>
                <p className="text-body-sm pb-7 pl-12 pr-8 text-muted-foreground sm:pl-14 sm:pr-0">
                  {t(`items.${item}.answer`)}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border/70 bg-muted/40">
        <Container className="py-16 text-center sm:py-20">
          <Reveal className="mx-auto flex max-w-xl flex-col items-center">
            <h2 className="text-h2">{t("ctaTitle")}</h2>
            <p className="text-body mt-4 text-muted-foreground">{t("ctaBody")}</p>
            <div className="mt-8">
              <CtaLink href="/experience" locale={locale}>
                {t("cta")}
              </CtaLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
