import {
  BookOpenCheck,
  BrainCircuit,
  Compass,
  Layers3,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const icons = {
  path: Compass,
  practice: BookOpenCheck,
  context: Layers3,
  ai: BrainCircuit,
  bilingual: MessageCircle,
  calm: Sparkles,
} as const;

export function FeatureIcon({ name }: { name: keyof typeof icons }) {
  const Icon = icons[name];
  return (
    <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      <Icon aria-hidden className="size-5" />
    </span>
  );
}
