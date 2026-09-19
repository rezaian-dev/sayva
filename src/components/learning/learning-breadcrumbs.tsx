import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function LearningBreadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  const t = await getTranslations("learn");

  return (
    <nav aria-label={t("breadcrumbs.label")} className="mb-8 flex flex-wrap items-center gap-1 text-body-sm text-muted-foreground">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          {index > 0 ? <ChevronRight aria-hidden className="size-4 rtl:rotate-180" /> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground hover:underline underline-offset-4">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-foreground">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
