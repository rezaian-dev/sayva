import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminNavigation } from "@/components/admin/admin-navigation";
import { Container } from "@/components/container";
import { requireAdmin } from "@/lib/admin/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const rawLocale = await getLocale();
  if (!routing.locales.includes(rawLocale as AppLocale)) notFound();
  const locale = rawLocale as AppLocale;
  await requireAdmin(locale);
  return (
    <main className="flex flex-1 bg-muted/30 py-8 md:py-12">
      <Container>
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <AdminNavigation />
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </main>
  );
}
