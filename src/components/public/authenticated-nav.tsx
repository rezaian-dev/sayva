import { getTranslations } from "next-intl/server";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Link } from "@/i18n/navigation";

export async function AuthenticatedNav({ name, isAdmin = false }: { name: string; isAdmin?: boolean }) {
  const t = await getTranslations("nav");

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden max-w-32 truncate px-2 text-body-sm font-medium text-foreground xl:block"
        title={name}
      >
        {name}
      </span>
      <Link
        href="/learn"
        className="rounded-lg px-2 text-body-sm font-medium text-foreground hover:bg-muted"
      >
        {t("learn")}
      </Link>
      <Link
        href="/practice"
        className="rounded-lg px-2 text-body-sm font-medium text-foreground hover:bg-muted"
      >
        {t("practice")}
      </Link>
      <Link
        href="/progress"
        className="rounded-lg px-2 text-body-sm font-medium text-foreground hover:bg-muted"
      >
        {t("progress")}
      </Link>
      {isAdmin ? (
        <Link
          href="/admin"
          className="rounded-lg px-2 text-body-sm font-medium text-foreground hover:bg-muted"
        >
          {t("admin")}
        </Link>
      ) : null}
      <Link
        href="/speaking"
        className="rounded-lg px-2 text-body-sm font-medium text-foreground hover:bg-muted"
      >
        {t("speaking")}
      </Link>
      <SignOutButton />
    </div>
  );
}
