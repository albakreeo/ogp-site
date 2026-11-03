"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { assertAdmin } from "@/lib/admin-auth";
import { CONTENT_FIELDS } from "@/lib/content";
import { saveSettings } from "@/lib/settings";

const text = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);

export async function saveSeoAction(fd: FormData): Promise<void> {
  assertAdmin((await headers()).get("authorization"));
  const og = text(fd, "og_image", 500);
  if (og && !/^https:\/\/\S+$/i.test(og)) throw new Error("The share image must be a full https:// URL.");
  await saveSettings({
    "seo.primary": text(fd, "primary", 2) === "en" ? "en" : "ar",
    "seo.title.ar": text(fd, "title_ar", 120),
    "seo.title.en": text(fd, "title_en", 120),
    "seo.description.ar": text(fd, "description_ar", 320),
    "seo.description.en": text(fd, "description_en", 320),
    "seo.keywords.ar": text(fd, "keywords_ar", 500),
    "seo.keywords.en": text(fd, "keywords_en", 500),
    "seo.og_image": og,
  });
  revalidatePath("/");
  revalidatePath("/admin/seo");
}

export async function saveContentAction(fd: FormData): Promise<void> {
  assertAdmin((await headers()).get("authorization"));
  const entries: Record<string, string> = {};
  for (const f of CONTENT_FIELDS) {
    const max = f.long ? 300 : 140;
    entries[`content.${f.key}.en`] = text(fd, `${f.key}_en`, max).replace(/\n+/g, " ");
    entries[`content.${f.key}.ar`] = text(fd, `${f.key}_ar`, max).replace(/\n+/g, " ");
  }
  await saveSettings(entries);
  revalidatePath("/");
  revalidatePath("/admin/seo");
}
