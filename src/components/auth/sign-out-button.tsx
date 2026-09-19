"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(false);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError(true);
        setIsSigningOut(false);
        return;
      }

      router.replace("/");
    } catch {
      setError(true);
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-busy={isSigningOut}
      >
        {isSigningOut ? t("signingOut") : t("signOut")}
      </Button>
      {error ? (
        <span className="text-caption text-destructive" role="alert">
          {t("signOutError")}
        </span>
      ) : null}
    </div>
  );
}
