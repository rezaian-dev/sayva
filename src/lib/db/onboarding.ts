import { connectToDatabase } from "@/lib/db/mongodb";
import {
  OnboardingProfile,
  type OnboardingProfileRecord,
} from "@/models/onboarding-profile";

export async function findOnboardingProfile(userId: string) {
  await connectToDatabase();

  return OnboardingProfile.findOne({ userId })
    .lean<OnboardingProfileRecord>()
    .exec();
}
