import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { AdminContentForm, type AdminContentFormValues } from "@/components/admin/admin-content-form";
import { requireAdmin } from "@/lib/admin/access";
import { adminContentDomains, type AdminContentDomain } from "@/lib/db/admin";
import { createGrammarContent, createListeningContent, createReadingContent, createSpeakingScenario, createVocabularyContent } from "@/actions/admin/content";
import { routing, type AppLocale } from "@/i18n/routing";

const actions = { vocabulary: createVocabularyContent, grammar: createGrammarContent, listening: createListeningContent, reading: createReadingContent, speaking: createSpeakingScenario };

function initialValues(domain: AdminContentDomain): AdminContentFormValues {
  const base = { order: 0, level: "" };
  if (domain === "vocabulary") return { ...base, examples: [], pronunciation: {} };
  if (domain === "grammar") return { ...base, examples: [], commonMistakes: [] };
  if (domain === "listening") return { ...base, transcriptVisibility: "on-request", transcript: {} };
  if (domain === "reading") return { ...base, sections: [] };
  return { ...base, successCriteria: [], preparationTips: [], expectedLanguage: "en", durationLimitSeconds: 60 };
}

export default async function NewAdminContentPage({ params }: { params: Promise<{ locale: string; domain: string }> }) {
  const { locale: rawLocale, domain: rawDomain } = await params;
  if (!hasLocale(routing.locales, rawLocale) || !adminContentDomains.includes(rawDomain as AdminContentDomain)) notFound();
  const locale = rawLocale as AppLocale;
  await requireAdmin(locale);
  const domain = rawDomain as AdminContentDomain;
  return <AdminContentForm domain={domain} initial={initialValues(domain)} action={actions[domain]} isEdit={false} />;
}
