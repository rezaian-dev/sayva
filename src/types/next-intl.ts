import type en from "../../messages/en.json";
import type { routing } from "@/i18n/routing";

/**
 * next-intl type augmentation: typed locales and typed message keys
 * (en.json is the type source of truth; keep fa.json in sync).
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof en;
  }
}
