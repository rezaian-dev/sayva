import { ArrowUpLeft, ArrowUpRight, Globe2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SayvaMark } from "@/components/brand/sayva-mark";
import { Container } from "@/components/container";
import { Link } from "@/i18n/navigation";
import { localeDirection, routing, type AppLocale } from "@/i18n/routing";

function DirectionalArrow({ locale }: { locale: AppLocale }) {
  const Icon = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  return <Icon aria-hidden className="size-4" />;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-body-sm text-deep-muted transition-colors duration-200 hover:text-deep-foreground"
    >
      {children}
    </Link>
  );
}

/**
 * Footer — a deep navy closing surface with the brand mark and a hairline
 * gold rule, so the page ends where it began: in the evening room.
 */
export async function SiteFooter({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("footer");
  const otherLocale = routing.locales.find((item) => item !== locale) ?? locale;

  return (
    <footer className="relative isolate overflow-hidden bg-deep text-deep-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-khatam-deep" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <Container className="relative grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8 lg:py-16">
        <div className="max-w-xs">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="SAYVA">
            <SayvaMark className="size-8 text-deep-foreground" />
            <span lang="en" dir="ltr" className="font-en text-sm font-extrabold tracking-[0.3em] me-[-0.3em] text-deep-foreground">
              SAYVA
            </span>
          </Link>
          <p className="text-body-sm mt-5 leading-relaxed text-deep-muted">{t("tagline")}</p>
        </div>

        <div>
          <h2 className="text-caption mb-4 font-semibold uppercase tracking-[0.16em] text-gold">
            {t("product")}
          </h2>
          <nav aria-label={t("product")} className="flex flex-col items-start gap-3">
            <FooterLink href="/features">{t("features")}</FooterLink>
            <FooterLink href="/experience">{t("experience")}</FooterLink>
          </nav>
        </div>

        <div>
          <h2 className="text-caption mb-4 font-semibold uppercase tracking-[0.16em] text-gold">
            {t("support")}
          </h2>
          <nav aria-label={t("support")} className="flex flex-col items-start gap-3">
            <FooterLink href="/about">{t("about")}</FooterLink>
            <FooterLink href="/faq">{t("faq")}</FooterLink>
            <Link
              href="/"
              locale={otherLocale}
              lang={otherLocale}
              dir={localeDirection(otherLocale)}
              className="inline-flex items-center gap-2 text-body-sm text-deep-muted transition-colors duration-200 hover:text-deep-foreground"
            >
              <Globe2 aria-hidden className="size-4" />
              {t("language")}
              <DirectionalArrow locale={locale} />
            </Link>
          </nav>
        </div>
      </Container>
      <div className="relative border-t border-deep-foreground/10">
        <Container className="flex flex-col gap-3 py-5 text-caption text-deep-muted sm:flex-row sm:items-center sm:justify-between">
          <span lang="en" dir="ltr" className="tracking-wide">
            {t("copyright")}
          </span>
          <span aria-hidden className="h-px w-16 bg-gold/60 sm:hidden" />
        </Container>
      </div>
    </footer>
  );
}
