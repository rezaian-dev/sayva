"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { authClient } from "@/lib/auth/client";
import { signInSchema, type SignInValues } from "@/validation/auth";
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

export function SignInForm() {
  const t = useTranslations("auth.signIn");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
  });

  async function onSubmit(values: SignInValues) {
    setServerError(null);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: true,
      });

      if (error) {
        setServerError(
          error.status === 401
            ? t("errors.invalidCredentials")
            : t("errors.generic"),
        );
        return;
      }

      router.replace("/app");
    } catch {
      setServerError(t("errors.generic"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="sign-in-email">{t("email")}</FieldLabel>
          <FieldContent>
            <Input
              id="sign-in-email"
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
          <FieldLabel htmlFor="sign-in-password">{t("password")}</FieldLabel>
          <FieldContent>
            <Input
              id="sign-in-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <FieldError>
              {errors.password ? t("errors.password") : undefined}
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
        {t("noAccount")} {" "}
        <Link href="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}
