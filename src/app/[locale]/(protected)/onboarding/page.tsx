import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findOnboardingProfile } from "@/lib/db/onboarding";
import { getServerSession } from "@/lib/auth/session";
import { redirect } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    notFound();
  }
  const locale = rawLocale as AppLocale;
  const session = await getServerSession();

  if (!session) {
    redirect({ href: "/sign-in", locale });
    return null;
  }

  const profile = await findOnboardingProfile(session.user.id);

  if (profile?.userId === session.user.id && profile.completedAt) {
    redirect({ href: "/app", locale });
  }

  const t = await getTranslations({ locale, namespace: "onboarding" });

  return (
    <main className="flex flex-1 items-center bg-muted/30 py-10 md:py-16">
      <Container>
        <Card className="mx-auto w-full max-w-3xl shadow-raised">
          <CardHeader className="gap-3 border-b px-6 py-7 sm:px-10">
            <p className="text-label text-gold">{t("eyebrow")}</p>
            <CardTitle className="text-h1">{t("title")}</CardTitle>
            <p className="text-body-sm max-w-2xl text-muted-foreground">
              {t("description")}
            </p>
          </CardHeader>
          <CardContent className="px-6 py-7 sm:px-10 sm:py-9">
            <OnboardingForm />
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
