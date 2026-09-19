import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { AdminContentDomain } from "@/lib/db/admin";
import type { ContentStatus } from "@/models/domain/common";
import type { AppLocale } from "@/i18n/routing";

export type AdminContentRow = {
  id: string;
  slug: string;
  title: string;
  level?: string;
  order: number;
  status: ContentStatus;
  updatedAt: Date;
};

export async function AdminContentTable({ domain, rows, total, page, status, level, locale }: { domain: AdminContentDomain; rows: AdminContentRow[]; total: number; page: number; status?: ContentStatus; level?: string; locale: AppLocale }) {
  const t = await getTranslations("admin");
  const pageCount = Math.max(1, Math.ceil(total / 20));
  const hrefForPage = (nextPage: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (level) params.set("level", level);
    params.set("page", String(nextPage));
    return `/admin/${domain}?${params.toString()}`;
  };
  return (
    <Card className="mt-6 overflow-hidden"><CardHeader><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-label text-gold">{t("content")}</p><CardTitle className="mt-2">{t(`domains.${domain}`)}</CardTitle></div><p className="text-body-sm text-muted-foreground">{total}</p></div></CardHeader><CardContent className="p-0">
      <div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-start text-body-sm"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">{t("fields.slug")}</th><th className="px-5 py-3 font-medium">{t("level")}</th><th className="px-5 py-3 font-medium">{t("order")}</th><th className="px-5 py-3 font-medium">{t("status")}</th><th className="px-5 py-3 font-medium">{t("updated")}</th><th className="px-5 py-3 text-end font-medium">{t("actions")}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border"><td className="px-5 py-4"><p className="font-medium">{row.title}</p><p className="text-caption text-muted-foreground">{row.slug}</p></td><td className="px-5 py-4">{row.level || "—"}</td><td className="px-5 py-4">{row.order}</td><td className="px-5 py-4"><Badge variant={row.status === "published" ? "default" : "outline"}>{t(`statuses.${row.status}`)}</Badge></td><td className="px-5 py-4 text-muted-foreground">{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(row.updatedAt)}</td><td className="px-5 py-4 text-end"><Link href={`/admin/${domain}/${row.id}`} className="font-medium text-primary hover:underline">{t("open")}</Link></td></tr>)}</tbody></table></div>
      {!rows.length ? <p className="p-6 text-body-sm text-muted-foreground">{t("noResults")}</p> : null}
      <div className="flex items-center justify-between gap-4 border-t border-border p-4 text-body-sm"><span className="text-muted-foreground">{page} / {pageCount}</span><div className="flex gap-2">{page > 1 ? <Link href={hrefForPage(page - 1)} className="rounded-lg border px-3 py-2 hover:bg-muted">←</Link> : null}{page < pageCount ? <Link href={hrefForPage(page + 1)} className="rounded-lg border px-3 py-2 hover:bg-muted">→</Link> : null}</div></div>
    </CardContent></Card>
  );
}
