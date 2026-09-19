import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const handleLocaleRouting = createMiddleware(routing);
const protectedPath = /^\/(?:fa|en)\/(?:app|onboarding|learn|practice|progress|admin|vocabulary|grammar|listening|reading|speaking)(?:\/|$)/;

/**
 * Locale negotiation plus an optimistic auth-cookie redirect for protected
 * areas. Pages still resolve the session and authorize server-side; this
 * proxy never acts as the security boundary.
 */
export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (protectedPath.test(pathname) && !getSessionCookie(request)) {
    const locale = pathname.split("/")[1] ?? routing.defaultLocale;
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return handleLocaleRouting(request);
}

export const config = {
  // Match all pathnames except API, Next internals, verification files, and
  // dotted assets. The auth API is handled directly by its route handler.
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
