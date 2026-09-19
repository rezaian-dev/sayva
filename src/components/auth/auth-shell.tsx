import { Sparkles } from "lucide-react";

import { Container } from "@/components/container";
import { Card } from "@/components/ui/card";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  asideTitle,
  asideBody,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  asideTitle: string;
  asideBody: string;
}) {
  return (
    <main className="flex flex-1 items-center bg-muted/30 py-10 md:py-16">
      <Container>
        <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-raised md:grid-cols-[0.8fr_1.2fr]">
          <aside className="hidden bg-primary p-8 text-primary-foreground md:flex md:flex-col md:justify-between lg:p-10">
            <div>
              <div className="mb-12 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gold text-gold-foreground">
                  <Sparkles aria-hidden className="size-4" />
                </span>
                <span className="font-en text-sm font-bold tracking-[0.22em]">SAYVA</span>
              </div>
              <p className="text-label text-primary-foreground/70">{asideTitle}</p>
              <p className="mt-4 text-body leading-relaxed text-primary-foreground/85">
                {asideBody}
              </p>
            </div>
            <div aria-hidden className="mt-12 h-px w-20 bg-gold" />
          </aside>

          <Card className="rounded-none border-0 bg-transparent py-8 shadow-none sm:p-10">
            <div className="px-6 sm:px-0">
              <p className="text-label text-gold">{eyebrow}</p>
              <h1 className="text-h1 mt-3">{title}</h1>
              <p className="text-body-sm mt-3 max-w-lg text-muted-foreground">
                {description}
              </p>
            </div>
            <div className="px-6 pt-8 sm:px-0">{children}</div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
