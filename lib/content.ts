// Editable page text. Elements in app/body.html carry data-cms="<key>" and hold
// <span class="en">…</span><span class="ar">…</span>; the markup is the default
// and an override from site_settings replaces the two spans.
import type { Settings } from "./settings";

export const CONTENT_FIELDS = [
  { key: "hero_h1", label: "Main heading (H1)", group: "Hero", long: false },
  { key: "hero_sub", label: "Text under the main heading", group: "Hero", long: true },
  { key: "clients_h2", label: "Clients heading", group: "Section headings (H2)", long: false },
  { key: "growth_h2", label: "Growth equation heading", group: "Section headings (H2)", long: false },
  { key: "services_h2", label: "Services heading", group: "Section headings (H2)", long: false },
  { key: "process_h2", label: "Process heading", group: "Section headings (H2)", long: false },
  { key: "results_h2", label: "Results heading", group: "Section headings (H2)", long: false },
  { key: "why_h2", label: "Why OGP heading", group: "Section headings (H2)", long: false },
  { key: "start_h2", label: "How to get started heading", group: "Section headings (H2)", long: false },
  { key: "contact_h2", label: "Contact heading", group: "Contact", long: false },
  { key: "contact_lead", label: "Text under the contact heading", group: "Contact", long: true },
] as const;

export type ContentKey = (typeof CONTENT_FIELDS)[number]["key"];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const unesc = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

const pattern = (key: string) =>
  new RegExp(`(data-cms="${key}"[^>]*>)<span class="en">(.*?)</span><span class="ar">(.*?)</span>`, "s");

/** The text currently in the markup, per field and language. */
export function readDefaults(html: string): Record<string, { en: string; ar: string }> {
  const out: Record<string, { en: string; ar: string }> = {};
  for (const f of CONTENT_FIELDS) {
    const m = pattern(f.key).exec(html);
    if (m) out[f.key] = { en: unesc(m[2]), ar: unesc(m[3]) };
  }
  return out;
}

export function applyContent(html: string, settings: Settings): string {
  let out = html;
  for (const f of CONTENT_FIELDS) {
    const en = settings[`content.${f.key}.en`];
    const ar = settings[`content.${f.key}.ar`];
    if (!en && !ar) continue;
    out = out.replace(pattern(f.key), (_m, open: string, curEn: string, curAr: string) =>
      `${open}<span class="en">${en ? esc(en) : curEn}</span><span class="ar">${ar ? esc(ar) : curAr}</span>`,
    );
  }
  return out;
}
