"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { authClient } from "@/lib/auth/client";
import { signUpSchema, type SignUpValues } from "@/validation/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
  });

  async function onSubmit(values: SignUpValues) {
    setServerError(null);

    try {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (error) {
        setServerError(t("errors.generic"));
        return;
      }

      router.replace("/onboarding");
    } catch {
      setServerError(t("errors.generic"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="sign-up-name">{t("name")}</FieldLabel>
          <FieldContent>
            <Input
              id="sign-up-name"
              type="text"
              autoComplete="name"
              placeholder={t("namePlaceholder")}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            <FieldError>
              {errors.name ? t("errors.name") : undefined}
            </FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="sign-up-email">{t("email")}</FieldLabel>
          <FieldContent>
            <Input
              id="sign-up-email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError>
              {errors.email ? t("errors.email") : undefined}
            </FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="sign-up-password">{t("password")}</FieldLabel>
          <FieldContent>
            <Input
              id="sign-up-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <FieldError>
              {errors.password ? t("errors.password") : undefined}
            </FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="sign-up-confirm-password">
            {t("confirmPassword")}
          </FieldLabel>
          <FieldContent>
            <Input
              id="sign-up-confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
            <FieldError>
              {errors.confirmPassword
                ? t("errors.confirmPassword")
                : undefined}
            </FieldError>
          </FieldContent>
        </Field>
      </FieldGroup>

      {serverError ? (
        <p className="mt-5 text-body-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="mt-7 w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>

      <p className="text-body-sm mt-6 text-center text-muted-foreground">
        {t("hasAccount")} {" "}
        <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
