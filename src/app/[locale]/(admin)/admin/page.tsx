import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getAdminOverviewData } from "@/lib/db/admin";

export default async function AdminHomePage() {
  const [t, data] = await Promise.all([getTranslations("admin"), getAdminOverviewData()]);
  const stats = [
    ["levels", data.levels, "/admin/curriculum"],
    ["vocabulary", data.vocabulary, "/admin/vocabulary"],
    ["grammar", data.grammar, "/admin/grammar"],
    ["listening", data.listening, "/admin/listening"],
    ["reading", data.reading, "/admin/reading"],
    ["speaking", data.speaking, "/admin/speaking"],
    ["practiceSets", data.practiceSets, "/admin/practice"],
  ] as const;
  return (
    <div>
      <header className="max-w-3xl"><p className="text-label text-gold">{t("eyebrow")}</p><h1 className="text-h1 mt-3">{t("title")}</h1><p className="text-body mt-4 text-muted-foreground">{t("description")}</p></header>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([key, count, href]) => <Link key={key} href={href}><Card className="h-full transition-colors hover:border-primary/40"><CardHeader><CardTitle>{t(`dashboardStats.${key}`)}</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{count}</p></CardContent></Card></Link>)}
      </div>
      <Card className="mt-8 border-gold/40 bg-gold/5"><CardContent className="p-5"><p className="text-body-sm text-muted-foreground">{t("help.draft")}</p><p className="text-body-sm mt-2 text-muted-foreground">{t("warnings.provider")}</p></CardContent></Card>
    </div>
  );
}
