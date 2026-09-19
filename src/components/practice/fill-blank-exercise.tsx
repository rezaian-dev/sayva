import { Input } from "@/components/ui/input";

export function FillBlankExercise({
  answer,
  onChange,
  label,
}: {
  answer: string;
  onChange: (answer: string) => void;
  label: string;
}) {
  return (
    <Input
      name="answer-preview"
      value={answer}
      onChange={(event) => onChange(event.target.value)}
      placeholder=""
      autoComplete="off"
      dir="auto"
      aria-label={label}
      className="max-w-xl text-base"
    />
  );
}
