import { ArrowUpLeft, ArrowUpRight, Globe2, Menu } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthenticatedNav } from "@/components/public/authenticated-nav";
import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getServerSession } from "@/lib/auth/session";
import { Link } from "@/i18n/navigation";
import { localeDirection, routing, type AppLocale } from "@/i18n/routing";

function DirectionalArrow({ locale }: { locale: AppLocale }) {
  const Icon = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  return <Icon aria-hidden className="size-4" />;
}

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative py-1 text-body-sm font-medium transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:bg-gold after:transition-transform after:duration-300 after:ease-out hover:text-foreground hover:after:scale-x-100 ${
        active
          ? "text-foreground after:scale-x-100"
          : "text-muted-foreground after:scale-x-0"
      }`}
    >
      {children}
    </Link>
  );
}

export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("nav");
  const otherLocale = routing.locales.find((item) => item !== locale) ?? locale;
  const session = await getServerSession();
  const items = [
    { href: "/features", label: t("features") },
    { href: "/experience", label: t("experience") },
    { href: "/about", label: t("about") },
    { href: "/faq", label: t("faq") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <Link
          href="/"
          aria-label="SAYVA"
          className="group flex shrink-0 items-center"
        >
          <BrandLogo className="transition-opacity duration-200 group-hover:opacity-80" />
        </Link>

        <nav aria-label={t("primaryNavigation")} className="hidden items-center gap-7 lg:flex">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 lg:flex">
          <Link
            href="/"
            locale={otherLocale}
            aria-label={t("languageLabel")}
            lang={otherLocale}
            dir={localeDirection(otherLocale)}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-body-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <Globe2 aria-hidden className="size-4" />
            <span>{t("language")}</span>
          </Link>
          <ThemeToggle />
          {session ? (
            <AuthenticatedNav name={session.user.name} isAdmin={session.user.role === "admin"} />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">{t("signIn")}</Link>
              </Button>
              <Button size="sm" className="ms-1" asChild>
                <Link href="/sign-up">
                  {t("signUp")}
                  <DirectionalArrow locale={locale} />
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("menu")}>
                <Menu aria-hidden className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={locale === "fa" ? "right" : "left"}
              className="flex w-[min(22rem,calc(100vw-1.5rem))] flex-col"
            >
              <SheetHeader className="text-start">
                <SheetTitle className="sr-only">{t("mobileNavigation")}</SheetTitle>
                <BrandLogo className="text-foreground" />
                <SheetDescription className="text-muted-foreground">
                  {t("primaryCta")}
                </SheetDescription>
              </SheetHeader>
              <nav aria-label={t("mobileNavigation")} className="mt-8 flex flex-col gap-1">
                {items.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="flex min-h-12 items-center rounded-lg px-3 text-body font-medium transition-colors hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3 border-t pt-6">
                <SheetClose asChild>
                  <Link
                    href="/"
                    locale={otherLocale}
                    lang={otherLocale}
                    dir={localeDirection(otherLocale)}
                    className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-body-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Globe2 aria-hidden className="size-4" />
                    {t("language")}
                  </Link>
                </SheetClose>
                {session ? (
                  <>
                    <SheetClose asChild>
                      <Link href="/learn" className="flex min-h-11 items-center rounded-lg px-3 text-body-sm font-medium hover:bg-muted">
                        {t("learn")}
                      </Link>
                    </SheetClose>
                    <AuthenticatedNav name={session.user.name} isAdmin={session.user.role === "admin"} />
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button variant="outline" asChild>
                        <Link href="/sign-in">{t("signIn")}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild>
                        <Link href="/sign-up">
                          {t("signUp")}
                          <DirectionalArrow locale={locale} />
                        </Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
