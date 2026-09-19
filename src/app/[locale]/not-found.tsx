import { useTranslations } from "next-intl";

import { SayvaMark } from "@/components/brand/sayva-mark";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <SayvaMark className="size-12 text-gold/50" />
      <p className="font-en text-caption font-semibold uppercase tracking-[0.24em] text-gold">
        404
      </p>
      <h1 className="text-h1">{t("title")}</h1>
      <p className="max-w-md text-body text-muted-foreground">{t("description")}</p>
      <Button asChild className="mt-2">
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </Container>
  );
}
