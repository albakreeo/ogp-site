import type { Metadata } from "next";
import type { Settings } from "./settings";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ogpdigital.com";

export const SEO_DEFAULTS = {
  title: "OGP — Online Growth Partner | شريك النمو الرقمي",
  description:
    "Digital performance agency in Riyadh: tracking, paid ads, SEO, CRO, websites and apps. وكالة أداء رقمي متخصصة في هندسة النمو والتسويق الموجه بالبيانات.",
};

export type SeoValues = {
  primary: "ar" | "en";
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  keywords: { ar: string; en: string };
  ogImage: string;
};

export function seoValues(s: Settings): SeoValues {
  return {
    primary: s["seo.primary"] === "en" ? "en" : "ar",
    title: { ar: s["seo.title.ar"] ?? "", en: s["seo.title.en"] ?? "" },
    description: { ar: s["seo.description.ar"] ?? "", en: s["seo.description.en"] ?? "" },
    keywords: { ar: s["seo.keywords.ar"] ?? "", en: s["seo.keywords.en"] ?? "" },
    ogImage: s["seo.og_image"] ?? "",
  };
}

export function buildMetadata(s: Settings): Metadata {
  const v = seoValues(s);
  const p = v.primary;
  const title = v.title[p] || v.title[p === "ar" ? "en" : "ar"] || SEO_DEFAULTS.title;
  const description = v.description[p] || v.description[p === "ar" ? "en" : "ar"] || SEO_DEFAULTS.description;
  const keywords = [v.keywords[p], v.keywords[p === "ar" ? "en" : "ar"]]
    .filter(Boolean)
    .join(",")
    .split(/[,،\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "OGP — Online Growth Partner",
      title,
      description,
      locale: p === "ar" ? "ar_SA" : "en_US",
      images: v.ogImage ? [{ url: v.ogImage }] : undefined,
    },
    twitter: {
      card: v.ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: v.ogImage ? [v.ogImage] : undefined,
    },
  };
}
