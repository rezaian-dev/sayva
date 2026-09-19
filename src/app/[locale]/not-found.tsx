import { useTranslations } from "next-intl";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-caption text-gold">404</p>
      <h1 className="text-h1">{t("title")}</h1>
      <p className="text-body text-muted-foreground">{t("description")}</p>
      <Button asChild className="mt-2">
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </Container>
  );
}
