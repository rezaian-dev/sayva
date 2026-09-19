import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? (await rootParams.locale()) ?? undefined;

  // Any non-locale path segment (e.g. a stray `/favicon.ico` request matched
  // by the dynamic [locale] route) must 404 instead of crashing the
  // messages import below with MODULE_NOT_FOUND.
  if (!hasLocale(routing.locales, resolvedLocale)) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
