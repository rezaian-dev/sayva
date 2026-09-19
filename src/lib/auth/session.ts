import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";

/**
 * The one server-side session access point used by layouts, pages, and
 * Server Actions. A database failure fails closed as an unauthenticated
 * request; it never fabricates a session.
 */
export async function getServerSession() {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    // Next uses this error to mark the route dynamic during a build. It must
    // not be converted into an unauthenticated session.
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      error.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    console.error("Unable to resolve the Better Auth session.", error);
    return null;
  }
}

export type ServerSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;
