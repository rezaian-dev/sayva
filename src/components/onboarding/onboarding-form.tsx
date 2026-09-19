"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { saveOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { onboardingSchema, type OnboardingValues } from "@/validation/onboarding";

export function OnboardingForm() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      level: undefined,
      goal: undefined,
    },
    mode: "onChange",
  });

  const levels = [
    { value: "beginner", title: t("levels.beginner.title"), body: t("levels.beginner.body") },
    { value: "elementary", title: t("levels.elementary.title"), body: t("levels.elementary.body") },
    { value: "intermediate", title: t("levels.intermediate.title"), body: t("levels.intermediate.body") },
    { value: "upper-intermediate", title: t("levels.upperIntermediate.title"), body: t("levels.upperIntermediate.body") },
    { value: "advanced", title: t("levels.advanced.title"), body: t("levels.advanced.body") },
  ] as const;

  const goals = [
    { value: "conversation", title: t("goals.conversation.title"), body: t("goals.conversation.body") },
    { value: "work", title: t("goals.work.title"), body: t("goals.work.body") },
    { value: "travel", title: t("goals.travel.title"), body: t("goals.travel.body") },
    { value: "study", title: t("goals.study.title"), body: t("goals.study.body") },
    { value: "confidence", title: t("goals.confidence.title"), body: t("goals.confidence.body") },
  ] as const;

  async function onSubmit(values: OnboardingValues) {
    setServerError(null);

    const result = await saveOnboarding(values);

    if (!result.ok) {
      if (result.code === "VALIDATION" && result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (field === "level" || field === "goal") {
            setError(field, { type: "server", message: messages[0] });
          }
        }
      } else if (result.code === "UNAUTHORIZED") {
        setServerError(t("errors.unauthorized"));
      } else {
        setServerError(t("errors.database"));
      }
      return;
    }

    router.replace("/app");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t("levelLabel")}</FieldLegend>
          <FieldContent>
            <Controller
              name="level"
              control={control}
              render={({ field, fieldState }) => (
                <RadioGroup
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {levels.map((item) => (
                    <FieldLabel
                      key={item.value}
                      htmlFor={`level-${item.value}`}
                      className="h-full cursor-pointer rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={`level-${item.value}`} value={item.value} />
                      <span className="flex flex-col gap-1">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-body-sm text-muted-foreground">
                          {item.body}
                        </span>
                      </span>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              )}
            />
            <FieldError>
              {formState.errors.level ? t("errors.level") : undefined}
            </FieldError>
          </FieldContent>
        </FieldSet>

        <FieldSet>
          <FieldLegend>{t("goalLabel")}</FieldLegend>
          <FieldContent>
            <Controller
              name="goal"
              control={control}
              render={({ field, fieldState }) => (
                <RadioGroup
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  aria-invalid={fieldState.invalid}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {goals.map((item) => (
                    <FieldLabel
                      key={item.value}
                      htmlFor={`goal-${item.value}`}
                      className="h-full cursor-pointer rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={`goal-${item.value}`} value={item.value} />
                      <span className="flex flex-col gap-1">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-body-sm text-muted-foreground">
                          {item.body}
                        </span>
                      </span>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              )}
            />
            <FieldError>
              {formState.errors.goal ? t("errors.goal") : undefined}
            </FieldError>
          </FieldContent>
        </FieldSet>
      </FieldGroup>

      {serverError ? (
        <p className="mt-5 text-body-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="mt-8 w-full"
        disabled={formState.isSubmitting}
        aria-busy={formState.isSubmitting}
      >
        {formState.isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
