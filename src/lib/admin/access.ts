import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getServerSession, type ServerSession } from "@/lib/auth/session";

export type AdminAccessResult =
  | { ok: true; session: ServerSession; userId: string }
  | { ok: false; code: "UNAUTHORIZED" | "FORBIDDEN" };

export function hasAdminRole(role: unknown) {
  return role === "admin" || (Array.isArray(role) && role.includes("admin"));
}

export async function getAdminAccess(): Promise<AdminAccessResult> {
  const session = await getServerSession();
  if (!session?.user?.id) return { ok: false, code: "UNAUTHORIZED" };
  if (!hasAdminRole(session.user.role)) return { ok: false, code: "FORBIDDEN" };
  return { ok: true, session, userId: session.user.id };
}

export async function requireAdmin(locale: AppLocale) {
  const result = await getAdminAccess();
  if (!result.ok) {
    redirect({ href: result.code === "UNAUTHORIZED" ? "/sign-in" : "/app", locale });
    throw new Error("Admin authorization redirect did not complete.");
  }
  return result;
}
