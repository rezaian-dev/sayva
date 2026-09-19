import localFont from "next/font/local";

/**
 * SAYVA local fonts. No Google Fonts or CDN fonts — both families are
 * vendored in src/fonts/ (OFL licenses kept alongside) and served by
 * Next.js as self-hosted static assets.
 *
 * - Vazirmatn: Persian/Arabic subset (U+0600–06FF and related ranges).
 * - Inter: Latin subset.
 *
 * Each locale's direction decides which family leads the font stack
 * (see globals.css). Missing glyphs fall back per-glyph to the other
 * family, so English words inside Persian UI render in Inter and any
 * Persian glyphs inside English UI render in Vazirmatn.
 */
export const vazirmatn = localFont({
  src: [
    {
      path: "../fonts/vazirmatn-arabic.woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const inter = localFont({
  src: [
    {
      path: "../fonts/inter-latin.woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});
