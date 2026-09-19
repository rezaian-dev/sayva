import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const links = [
  { key: "vocabulary", href: "/vocabulary" },
  { key: "grammar", href: "/grammar" },
  { key: "listening", href: "/listening" },
  { key: "reading", href: "/reading" },
] as const;

export async function DomainNavigation() {
  const t = await getTranslations("domains");
  return (
    <nav aria-label={t("navigationLabel")} className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-body-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
        >
          {t(`links.${link.key}`)}
        </Link>
      ))}
    </nav>
  );
}
