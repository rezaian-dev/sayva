import { ArrowUpLeft, ArrowUpRight, Headphones } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/container";
import { DomainNavigation } from "@/components/domains/domain-navigation";
import { ProgressBadge } from "@/components/domains/progress-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localize } from "@/lib/learning/localize";
import type { ListeningListItem } from "@/lib/domains/types";
import type { AppLocale } from "@/i18n/routing";
import { EmptyState } from "@/components/domains/empty-state";

export async function ListeningHome({ data, locale }: { data: { items: ListeningListItem[] }; locale: AppLocale }) {
  const t = await getTranslations("domains.listening.home");
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  return <main className="flex flex-1 bg-muted/30 py-10 md:py-16"><Container><div className="mx-auto w-full max-w-6xl">
    <DomainNavigation /><header className="mt-8 max-w-3xl"><p className="text-label flex items-center gap-3 font-semibold uppercase tracking-[0.14em] text-gold"><span aria-hidden className="eyebrow-rule" />{t("eyebrow")}</p><h1 className="text-h1 mt-3">{t("title")}</h1><p className="text-body mt-4 text-muted-foreground">{t("description")}</p></header>
    <section className="mt-10" aria-labelledby="listening-list"><div className="mb-5 flex items-end justify-between gap-4"><h2 id="listening-list" className="text-h2">{t("available")}</h2><span className="text-body-sm text-muted-foreground">{data.items.length}</span></div>
      {data.items.length ? <div className="grid gap-4 md:grid-cols-2">{data.items.map((item) => <Card key={item.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="flex items-center gap-2"><Headphones aria-hidden className="size-5 text-gold" />{localize(item.title, locale)}</CardTitle><ProgressBadge domain="listening" state={item.state} /></div><p className="text-body-sm text-muted-foreground">{localize(item.description, locale)}</p></CardHeader><CardContent className="flex items-center justify-between gap-3"><span className="text-body-sm text-muted-foreground">{item.durationSeconds ? t("seconds", { count: item.durationSeconds }) : t("durationUnknown")}</span><Link href={`/listening/${item.id}`} className="inline-flex items-center gap-2 text-body-sm font-medium text-primary hover:underline">{t("open")}<Arrow aria-hidden /></Link></CardContent></Card>)}</div> : <EmptyState message={t("empty")} />}
    </section>
  </div></Container></main>;
}
