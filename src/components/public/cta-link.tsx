import { ArrowUpLeft, ArrowUpRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function CtaLink({
  href,
  children,
  locale,
  variant = "default",
  size = "default",
  className,
}: {
  href: string;
  children: React.ReactNode;
  locale: AppLocale;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
}) {
  const Icon = locale === "fa" ? ArrowUpLeft : ArrowUpRight;

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href}>
        {children}
        <Icon aria-hidden className="size-4" />
      </Link>
    </Button>
  );
}
