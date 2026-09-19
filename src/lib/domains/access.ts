import { findOnboardingProfile } from "@/lib/db/onboarding";
import { getServerSession } from "@/lib/auth/session";

export async function getActionLearner() {
  const session = await getServerSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const profile = await findOnboardingProfile(userId);
  if (!profile?.completedAt || profile.userId !== userId) return null;
  return { userId };
}
