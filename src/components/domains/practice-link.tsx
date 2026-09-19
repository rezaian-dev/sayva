import { ArrowUpLeft, ArrowUpRight, Dumbbell } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { practicePath } from "@/lib/practice/paths";
import type { AppLocale } from "@/i18n/routing";

export async function DomainPracticeLink({
  practiceSetId,
  locale,
}: {
  practiceSetId: string | null;
  locale: AppLocale;
}) {
  if (!practiceSetId) return null;
  const t = await getTranslations("domains.actions");
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  return (
    <Button asChild>
      <Link href={practicePath(practiceSetId)}>
        <Dumbbell aria-hidden />
        {t("practice")}
        <Arrow aria-hidden />
      </Link>
    </Button>
  );
}
