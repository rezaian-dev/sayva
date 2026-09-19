import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function AdminNavigation() {
  const t = await getTranslations("admin");
  const links = [
    ["/admin", t("dashboard")],
    ["/admin/curriculum", t("curriculum")],
    ["/admin/practice", t("practice")],
    ["/admin/vocabulary", t("domains.vocabulary")],
    ["/admin/grammar", t("domains.grammar")],
    ["/admin/listening", t("domains.listening")],
    ["/admin/reading", t("domains.reading")],
    ["/admin/speaking", t("domains.speaking")],
  ] as const;
  return (
    <nav aria-label={t("title")} className="h-fit rounded-xl border border-border bg-card p-2 lg:sticky lg:top-24">
      <p className="px-3 pb-2 pt-2 text-label text-gold">{t("eyebrow")}</p>
      <div className="grid gap-1 sm:grid-cols-4 lg:grid-cols-1">
        {links.map(([href, label]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-body-sm font-medium hover:bg-muted">{label}</Link>)}
      </div>
    </nav>
  );
}
