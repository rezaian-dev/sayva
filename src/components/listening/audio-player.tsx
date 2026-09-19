"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ListeningAudioPlayer({ src, title }: { src: string; title: string }) {
  const t = useTranslations("domains.listening.detail");
  const [hasError, setHasError] = useState(false);

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <audio
        controls
        preload="metadata"
        src={src}
        aria-label={title}
        onError={() => setHasError(true)}
        onLoadedData={() => setHasError(false)}
        className="w-full"
      >
        <a href={src}>{t("downloadAudio")}</a>
      </audio>
      {hasError ? (
        <p className="text-body-sm text-destructive" role="alert">{t("audioError")}</p>
      ) : null}
    </div>
  );
}
