import { redirect } from "@/i18n/navigation";
import { findOnboardingProfile } from "@/lib/db/onboarding";
import { getServerSession, type ServerSession } from "@/lib/auth/session";
import type { OnboardingProfileRecord } from "@/models/onboarding-profile";
import type { AppLocale } from "@/i18n/routing";

export async function requireLearner(locale: AppLocale): Promise<{
  session: ServerSession;
  profile: OnboardingProfileRecord;
}> {
  const session = await getServerSession();

  if (!session) {
    redirect({ href: "/sign-in", locale });
    throw new Error("Authentication redirect did not complete.");
  }

  const profile = await findOnboardingProfile(session.user.id);

  if (!profile?.completedAt || profile.userId !== session.user.id) {
    redirect({ href: "/onboarding", locale });
    throw new Error("Onboarding redirect did not complete.");
  }

  return { session, profile };
}
