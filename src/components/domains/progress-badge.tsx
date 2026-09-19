import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";

export async function ProgressBadge({
  domain,
  state,
}: {
  domain: "vocabulary" | "grammar" | "listening" | "reading";
  state: string | null;
}) {
  if (!state) return null;
  const t = await getTranslations(`domains.${domain}.states`);
  const label =
    state === "new" ? t("new") :
    state === "learning" ? t("learning") :
    state === "known" ? t("known") :
    state === "in_progress" ? t("in_progress") :
    state === "completed" ? t("completed") : state;
  return <Badge variant={state === "completed" || state === "known" ? "secondary" : "outline"}>{label}</Badge>;
}
