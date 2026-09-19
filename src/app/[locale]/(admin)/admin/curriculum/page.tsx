import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getAdminCurriculumData } from "@/lib/db/admin";
import type { ContentStatus } from "@/models/domain/common";

type CurriculumRow = { _id: { toString(): string }; slug?: string; title?: { en: string }; order: number; status: ContentStatus };

export default async function AdminCurriculumPage() {
  const [t, data] = await Promise.all([getTranslations("admin"), getAdminCurriculumData()]);
  const sections = [
    ["level", data.levels, "Level"],
    ["course", data.courses, "Course"],
    ["unit", data.units, "Unit"],
    ["lesson", data.lessons, "Lesson"],
  ] as const;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-label text-gold">{t("curriculum")}</p><h1 className="text-h2 mt-2">{t("curriculum")}</h1></div><Button asChild><Link href="/admin/curriculum/new?entity=level">{t("new")}</Link></Button></div>
      <p className="text-body-sm mt-3 text-muted-foreground">{t("help.draft")}</p>
      <div className="mt-8 grid gap-5">
        {sections.map(([entity, items, label]) => <Card key={entity}><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{label}s</CardTitle><Button size="sm" variant="outline" asChild><Link href={`/admin/curriculum/new?entity=${entity}`}>{t("create")}</Link></Button></div></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[36rem] text-start text-body-sm"><thead className="bg-muted/60"><tr><th className="px-5 py-3 font-medium">{t("fields.slug")}</th><th className="px-5 py-3 font-medium">{t("order")}</th><th className="px-5 py-3 font-medium">{t("status")}</th><th className="px-5 py-3 text-end font-medium">{t("actions")}</th></tr></thead><tbody>{(items as unknown as CurriculumRow[]).map((item) => { const id = item._id.toString(); return <tr key={id} className="border-t border-border"><td className="px-5 py-4"><p className="font-medium">{item.title?.en ?? item.slug ?? id}</p><p className="text-caption text-muted-foreground">{item.slug ?? id}</p></td><td className="px-5 py-4">{item.order}</td><td className="px-5 py-4"><Badge variant={item.status === "published" ? "default" : "outline"}>{t(`statuses.${item.status}`)}</Badge></td><td className="px-5 py-4 text-end"><Link href={`/admin/curriculum/${entity}/${id}`} className="font-medium text-primary hover:underline">{t("open")}</Link></td></tr>; })}</tbody></table>{!items.length ? <p className="p-5 text-body-sm text-muted-foreground">{t("noResults")}</p> : null}</CardContent></Card>)}
      </div>
    </div>
  );
}
