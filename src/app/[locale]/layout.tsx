import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { localeDirection, routing } from "@/i18n/routing";
import { inter, vazirmatn } from "@/lib/fonts";

import "../globals.css";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Enables static prerendering of both locales at build time.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<LayoutProps, "children">): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const configuredSiteUrl = rawSiteUrl ? rawSiteUrl : undefined;
  const siteUrl = configuredSiteUrl ?? "http://localhost:3000";
  const localizedPath = `/${locale}`;

  let metadataBase: URL | undefined;
  try {
    metadataBase = new URL(siteUrl);
  } catch {
    metadataBase = new URL("http://localhost:3000");
  }

  return {
    metadataBase,
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    alternates: configuredSiteUrl
      ? {
          canonical: localizedPath,
          languages: {
            fa: "/fa",
            en: "/en",
          },
        }
      : undefined,
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: locale === "fa" ? "fa_IR" : "en_US",
      url: localizedPath,
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: "/images/og/og-cover.jpg",
          width: 1200,
          height: 630,
          alt: t("siteName"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/images/og/og-cover.jpg"],
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = localeDirection(locale);


  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${vazirmatn.variable} ${inter.variable}`}
    >
      <head>
        {/* Scroll-reveal content ships with a hidden initial style (opacity:0)
            in the HTML so the client can animate it in. If no JavaScript
            ever runs, nothing would make it visible — guarantee visibility
            with no motion. */}
        <noscript>
          <style>{`[data-motion-reveal]{opacity:1!important;transform:none!important;}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <DirectionProvider dir={dir}>
              <TooltipProvider delayDuration={200}>
                <SiteHeader locale={locale} />
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                <SiteFooter locale={locale} />
              </TooltipProvider>
            </DirectionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
