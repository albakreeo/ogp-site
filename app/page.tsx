import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Script from "next/script";
import "./site.css";
import { applyContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";

const html = fs.readFileSync(path.join(process.cwd(), "app", "body.html"), "utf8");

// The page is prerendered; saving in /admin/seo calls revalidatePath("/") so the
// next visit gets the updated tags and headings.
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getSettings());
}

export default async function Page() {
  const content = applyContent(html, await getSettings());
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <Script src="/site.js" strategy="afterInteractive" />
    </>
  );
}
