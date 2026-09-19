"use client";

import { SayvaMark } from "@/components/brand/sayva-mark";

import "./globals.css";

/**
 * Root-level fatal error boundary.
 *
 * Rendered outside the locale layout, so it must be self-contained: it
 * provides its own `<html>`/`<body>` and imports the stylesheet directly
 * for the design tokens. No i18n, no network, no data — the worst moment
 * for a visitor still shows a calm, on-brand surface.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-background text-foreground antialiased">
        <main className="w-full max-w-md px-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-foreground">
            <SayvaMark className="size-7" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The page could not be loaded. Your saved work is not affected — try
            again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
