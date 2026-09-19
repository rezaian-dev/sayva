import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getServerSession } from "@/lib/auth/session";
import { redirect } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function SignInPage({
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

  if (session) {
    redirect({ href: "/app", locale });
  }

  const t = await getTranslations({ locale, namespace: "auth.signIn" });
  const shell = await getTranslations({ locale, namespace: "auth.shell" });

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      asideTitle={shell("title")}
      asideBody={shell("body")}
    >
      <SignInForm />
    </AuthShell>
  );
}
