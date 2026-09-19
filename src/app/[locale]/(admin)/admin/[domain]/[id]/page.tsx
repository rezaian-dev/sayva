import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { AdminContentForm, AdminStatusForm, type AdminContentFormValues } from "@/components/admin/admin-content-form";
import { requireAdmin } from "@/lib/admin/access";
import { adminContentDomains, getAdminContent, type AdminContentDomain } from "@/lib/db/admin";
import { setGrammarStatus, updateGrammarContent, setListeningStatus, updateListeningContent, setReadingStatus, updateReadingContent, setSpeakingStatus, updateSpeakingScenario, setVocabularyStatus, updateVocabularyContent } from "@/actions/admin/content";
import { routing, type AppLocale } from "@/i18n/routing";

const actions = { vocabulary: { update: updateVocabularyContent, status: setVocabularyStatus }, grammar: { update: updateGrammarContent, status: setGrammarStatus }, listening: { update: updateListeningContent, status: setListeningStatus }, reading: { update: updateReadingContent, status: setReadingStatus }, speaking: { update: updateSpeakingScenario, status: setSpeakingStatus } };

function valuesFor(domain: AdminContentDomain, record: Record<string, unknown>, id: string): AdminContentFormValues {
  const base = { ...record, id, lessonId: record.lessonId && typeof record.lessonId === "object" ? String(record.lessonId) : record.lessonId, practiceSetId: record.practiceSetId && typeof record.practiceSetId === "object" ? String(record.practiceSetId) : record.practiceSetId };
  if (domain === "vocabulary") return base;
  return base;
}

export default async function EditAdminContentPage({ params }: { params: Promise<{ locale: string; domain: string; id: string }> }) {
  const { locale: rawLocale, domain: rawDomain, id } = await params;
  if (!hasLocale(routing.locales, rawLocale) || !adminContentDomains.includes(rawDomain as AdminContentDomain)) notFound();
  const locale = rawLocale as AppLocale;
  await requireAdmin(locale);
  const domain = rawDomain as AdminContentDomain;
  const record = await getAdminContent(domain, id);
  if (!record) notFound();
  const initial = valuesFor(domain, record as unknown as Record<string, unknown>, id);
  return <><AdminContentForm domain={domain} initial={initial} action={actions[domain].update} isEdit /><AdminStatusForm id={id} status={initial.status ?? "draft"} action={actions[domain].status} /></>;
}
