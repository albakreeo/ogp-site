import { ADMIN_REALM, isAdminAuthorized } from "@/lib/admin-auth";
import { isDbConfigured, listLeads } from "@/lib/leads-store";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "created_at", "status", "name", "phone", "site", "need", "lang", "channel", "tags", "note",
  "cta_source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "keyword",
  "campaign_id", "adgroup_id", "gclid", "gbraid", "wbraid", "fbclid", "landing_page", "referrer", "ip",
] as const;

function cell(value: unknown): string {
  const s = value == null ? "" : Array.isArray(value) ? value.join("; ") : value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formula injection, then quote.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!isAdminAuthorized(request.headers.get("authorization"))) {
    return new Response("Authentication required.", { status: 401, headers: { "WWW-Authenticate": ADMIN_REALM } });
  }
  if (!isDbConfigured) return new Response("DATABASE_URL is not configured.", { status: 503 });
  const leads = await listLeads({}, 5000);
  const rec = leads as unknown as Record<string, unknown>[];
  const lines = [COLUMNS.join(","), ...rec.map((l) => COLUMNS.map((c) => cell(l[c])).join(","))];
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ogp-leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
