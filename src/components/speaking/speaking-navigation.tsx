import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function SpeakingNavigation() {
  const t = await getTranslations("speaking");
  return (
    <nav aria-label={t("navigationLabel")} className="flex flex-wrap gap-2">
      <Link href="/speaking" className="rounded-full border border-border bg-card px-3 py-1.5 text-body-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground">
        {t("navigation.home")}
      </Link>
    </nav>
  );
}
