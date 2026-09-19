"use client";

import { useTranslations } from "next-intl";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-h1">{t("title")}</h1>
      <p className="text-body text-muted-foreground">{t("description")}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>{t("retry")}</Button>
        <Button variant="outline" asChild>
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
      {error.digest ? (
        <p className="text-caption text-muted-foreground" aria-hidden>
          {error.digest}
        </p>
      ) : null}
    </Container>
  );
}
