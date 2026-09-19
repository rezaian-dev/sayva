import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { getServerSession } from "@/lib/auth/session";
import { findOnboardingProfile } from "@/lib/db/onboarding";
import { redirect } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Keep the Phase 3 authenticated entry URL stable while the learning home
 * becomes the first real product destination in Phase 4.
 */
export default async function AppHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const session = await getServerSession();

  if (!session) {
    redirect({ href: "/sign-in", locale });
    return null;
  }

  const profile = await findOnboardingProfile(session.user.id);
  if (!profile?.completedAt || profile.userId !== session.user.id) {
    redirect({ href: "/onboarding", locale });
    return null;
  }

  redirect({ href: "/learn", locale });
}
