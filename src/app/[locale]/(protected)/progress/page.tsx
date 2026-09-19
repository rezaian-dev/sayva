import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { getProgressDashboardData } from "@/lib/db/progress-dashboard";
import { requireLearner } from "@/lib/learning/access";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = rawLocale as AppLocale;
  const { session, profile } = await requireLearner(locale);
  const data = await getProgressDashboardData(session.user.id, profile.level);
  return <ProgressDashboard data={data} locale={locale} />;
}
