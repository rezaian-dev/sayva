import type { MetadataRoute } from "next";

const locales = ["fa", "en"] as const;
const paths = ["", "/features", "/experience", "/about", "/faq"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((alternate) => [
            alternate,
            `${siteUrl}/${alternate}${path}`,
          ])
        ),
      },
    }))
  );
}
