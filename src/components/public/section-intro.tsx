import { cn } from "cn";

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="text-caption mb-4 font-semibold uppercase tracking-[0.16em] text-gold">
        {eyebrow}
      </p>
      <h2 className="text-h1">{title}</h2>
      {description ? (
        <p className="text-body mt-5 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
