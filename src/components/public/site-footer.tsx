import { ArrowUpLeft, ArrowUpRight, Globe2, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/container";
import { Link } from "@/i18n/navigation";
import { localeDirection, routing, type AppLocale } from "@/i18n/routing";

function DirectionalArrow({ locale }: { locale: AppLocale }) {
  const Icon = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  return <Icon aria-hidden className="size-4" />;
}

export async function SiteFooter({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("footer");
  const otherLocale = routing.locales.find((item) => item !== locale) ?? locale;

  return (
    <footer className="border-t border-border/80 bg-card">
      <Container className="grid gap-12 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8 lg:py-16">
        <div className="max-w-xs">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles aria-hidden className="size-4" />
            </span>
            <span className="font-en text-sm font-bold tracking-[0.22em]">SAYVA</span>
          </Link>
          <p className="text-body-sm mt-5 text-muted-foreground">{t("tagline")}</p>
        </div>

        <div>
          <h2 className="text-label mb-4">{t("product")}</h2>
          <nav aria-label={t("product")} className="flex flex-col items-start gap-3">
            <Link href="/features" className="text-body-sm text-muted-foreground hover:text-foreground">
              {t("features")}
            </Link>
            <Link href="/experience" className="text-body-sm text-muted-foreground hover:text-foreground">
              {t("experience")}
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="text-label mb-4">{t("support")}</h2>
          <nav aria-label={t("support")} className="flex flex-col items-start gap-3">
            <Link href="/about" className="text-body-sm text-muted-foreground hover:text-foreground">
              {t("about")}
            </Link>
            <Link href="/faq" className="text-body-sm text-muted-foreground hover:text-foreground">
              {t("faq")}
            </Link>
            <Link
              href="/"
              locale={otherLocale}
              lang={otherLocale}
              dir={localeDirection(otherLocale)}
              className="inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-foreground"
            >
              <Globe2 aria-hidden className="size-4" />
              {t("language")}
              <DirectionalArrow locale={locale} />
            </Link>
          </nav>
        </div>
      </Container>
      <Container className="flex flex-col gap-3 border-t border-border/70 py-5 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="font-en tracking-wide">{t("copyright")}</span>
        <span aria-hidden className="h-px w-16 bg-gold sm:hidden" />
      </Container>
    </footer>
  );
}
