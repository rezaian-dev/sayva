import Image from "next/image";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Container } from "@/components/container";

/**
 * Auth layout: a quiet image-led panel (the evening study nook) carrying
 * the brand and a short promise, beside a calm form surface. The image is
 * the atmosphere; the form stays the focus.
 */
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
    <main className="flex flex-1 bg-background py-8 md:py-14">
      <Container>
        <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-raised md:grid-cols-[0.85fr_1.15fr]">
          <aside className="relative hidden overflow-hidden bg-deep md:block">
            <Image
              src="/images/auth/quiet-room.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 0px, 42vw"
              className="object-cover object-center opacity-90"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-deep via-deep/45 to-deep/15"
            />
            <div className="relative flex h-full min-h-[32rem] flex-col justify-between p-8 lg:p-10">
              <BrandLogo className="text-deep-foreground" />
              <div>
                <span aria-hidden className="eyebrow-rule mb-6" />
                <p className="text-label text-deep-foreground/80">{asideTitle}</p>
                <p className="text-body mt-3 max-w-sm leading-relaxed text-deep-foreground/85">
                  {asideBody}
                </p>
              </div>
            </div>
          </aside>

          <div className="px-5 py-10 sm:px-10 sm:py-12">
            <p className="text-label font-semibold text-gold">{eyebrow}</p>
            <h1 className="text-h1 mt-3">{title}</h1>
            <p className="text-body-sm mt-3 max-w-lg text-muted-foreground">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </Container>
    </main>
  );
}
