"use server";

import { getServerSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OnboardingProfile } from "@/models/onboarding-profile";
import { onboardingSchema } from "@/validation/onboarding";

export type OnboardingActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNAUTHORIZED" | "VALIDATION" | "DATABASE";
      fieldErrors?: Record<string, string[]>;
    };

/**
 * Authenticate → authorize ownership → validate → persist.
 * The user id is always taken from Better Auth, never from browser input.
 */
export async function saveOnboarding(
  input: unknown,
): Promise<OnboardingActionResult> {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  try {
    await connectToDatabase();

    // The query is scoped to the authenticated owner. The comparison keeps
    // the authorization boundary explicit before any mutation is attempted.
    const existingProfile = await OnboardingProfile.findOne({ userId })
      .select("userId")
      .lean<{ userId: string }>()
      .exec();

    if (existingProfile && existingProfile.userId !== userId) {
      return { ok: false, code: "UNAUTHORIZED" };
    }

    const parsed = onboardingSchema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.reduce<Record<string, string[]>>(
        (errors, issue) => {
          const field = issue.path[0];
          if (typeof field === "string") {
            errors[field] ??= [];
            errors[field].push(issue.message);
          }
          return errors;
        },
        {},
      );

      return { ok: false, code: "VALIDATION", fieldErrors };
    }

    const savedProfile = await OnboardingProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          level: parsed.data.level,
          goal: parsed.data.goal,
          completedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )
      .lean<{ userId: string }>()
      .exec();

    if (!savedProfile || savedProfile.userId !== userId) {
      return { ok: false, code: "UNAUTHORIZED" };
    }

    return { ok: true };
  } catch (error) {
    console.error("Unable to persist SAYVA onboarding.", error);
    return { ok: false, code: "DATABASE" };
  }
}
