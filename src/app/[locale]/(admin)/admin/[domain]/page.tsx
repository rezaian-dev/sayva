import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminContentTable, type AdminContentRow } from "@/components/admin/admin-content-table";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { adminContentDomains, getAdminContentList } from "@/lib/db/admin";
import { routing, type AppLocale } from "@/i18n/routing";
import { contentStatusValues, type ContentStatus } from "@/models/domain/common";
import type { GrammarTopicRecord } from "@/models/grammar/types";
import type { ListeningItemRecord } from "@/models/listening/types";
import type { ReadingItemRecord } from "@/models/reading/types";
import type { SpeakingScenarioRecord } from "@/models/speaking/types";
import type { VocabularyItemRecord } from "@/models/vocabulary/types";

function asRows(domain: string, items: unknown[]): AdminContentRow[] {
  return items.map((raw) => {
    const item = raw as { _id: { toString(): string }; slug: string; level?: string; order: number; status: ContentStatus; updatedAt: Date };
    const title = domain === "vocabulary" ? (raw as VocabularyItemRecord).word : domain === "grammar" ? (raw as GrammarTopicRecord).title.en : domain === "listening" ? (raw as ListeningItemRecord).title.en : domain === "reading" ? (raw as ReadingItemRecord).title.en : (raw as SpeakingScenarioRecord).title.en;
    return { id: item._id.toString(), slug: item.slug, title, level: item.level, order: item.order, status: item.status, updatedAt: item.updatedAt };
  });
}

export default async function AdminContentPage({ params, searchParams }: { params: Promise<{ locale: string; domain: string }>; searchParams: Promise<{ status?: string; level?: string; page?: string }> }) {
  const { locale: rawLocale, domain } = await params;
  if (!hasLocale(routing.locales, rawLocale) || !adminContentDomains.includes(domain as (typeof adminContentDomains)[number])) notFound();
  const locale = rawLocale as AppLocale;
  const query = await searchParams;
  const status = contentStatusValues.includes(query.status as ContentStatus) ? query.status as ContentStatus : undefined;
  const level = query.level?.trim() || undefined;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const [t, result] = await Promise.all([getTranslations("admin"), getAdminContentList(domain as (typeof adminContentDomains)[number], status, level, page)]);
  const domainLabel = domain === "vocabulary" ? t("domains.vocabulary") : domain === "grammar" ? t("domains.grammar") : domain === "listening" ? t("domains.listening") : domain === "reading" ? t("domains.reading") : t("domains.speaking");
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-label text-gold">{t("content")}</p><h1 className="text-h2 mt-2">{domainLabel}</h1></div><Button asChild><Link href={`/admin/${domain}/new`}>{t("new")}</Link></Button></div><form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4" method="get"><label className="grid gap-1 text-body-sm"><span>{t("filterStatus")}</span><select name="status" defaultValue={status ?? ""} className="h-10 rounded-lg border border-input bg-background px-3"><option value="">{t("allStatuses")}</option>{contentStatusValues.map((item) => <option key={item} value={item}>{t(`statuses.${item}`)}</option>)}</select></label><label className="grid gap-1 text-body-sm"><span>{t("filterLevel")}</span><input name="level" defaultValue={level ?? ""} className="h-10 rounded-lg border border-input bg-background px-3" /></label><Button type="submit" variant="outline">{t("open")}</Button></form><AdminContentTable domain={domain as (typeof adminContentDomains)[number]} rows={asRows(domain, result.items)} total={result.total} page={result.page} status={status} level={level} locale={locale} /></div>;
}
