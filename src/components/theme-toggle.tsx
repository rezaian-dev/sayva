"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Two-state theme toggle: Light ↔ Dark. There is no menu, no dialog and no
 * visible "System" option — the underlying next-themes provider still
 * honors the OS preference internally, but the user-facing control is a
 * single icon button.
 *
 * First-render correctness without flicker: the visible icon is decided by
 * CSS (the `.dark` class on <html>), not by React state. Both icons are
 * rendered stacked and crossfade when the class flips, so the SSR HTML and
 * the first client paint always match — no `isMounted` gate, no hydration
 * mismatch. The only client work is the click handler.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("toggle")}
          aria-pressed={resolvedTheme === "dark"}
          onClick={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
        >
          <span className="relative block size-4">
            <Sun
              aria-hidden
              className="absolute inset-0 size-4 transition-all duration-300 ease-out dark:rotate-90 dark:scale-0 dark:opacity-0"
            />
            <Moon
              aria-hidden
              className="absolute inset-0 size-4 -rotate-90 scale-0 opacity-0 transition-all duration-300 ease-out dark:rotate-0 dark:scale-100 dark:opacity-100"
            />
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {t("toggle")}
      </TooltipContent>
    </Tooltip>
  );
}
