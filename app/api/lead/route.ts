import { NextResponse } from "next/server";
import { channelOf } from "@/lib/channel";
import { insertLead, isDbConfigured, type NewLead } from "@/lib/leads-store";

export const runtime = "nodejs";

const NEEDS: Record<string, string> = {
  ads: "Ads and marketing / إعلانات وتسويق",
  web: "Website or app / موقع أو تطبيق",
  both: "Both / كلاهما",
};

// Best-effort limiter (per server instance): 5 requests per IP per 10 minutes.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function sendEmail(rows: [string, string][], name: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const to = process.env.LEAD_TO_EMAIL || "info@ogpdigital.com";
  const from = process.env.LEAD_FROM_EMAIL || "OGP Website <onboarding@resend.dev>";
  const html =
    `<h2>New free-audit request</h2><table cellpadding="6">` +
    rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("") +
    `</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: `New audit request: ${name}`, html, text }),
  });
  if (!res.ok) console.error("[lead] Resend error", res.status, await res.text());
  return res.ok;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: real visitors leave this empty. Pretend success so bots move on.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (limited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = str(body.name, 120);
  const phone = str(body.phone, 40);
  if (!name || !phone || !/^[+\d][\d\s()+-]{5,}$/.test(phone)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }

  if (body.consent !== true) {
    return NextResponse.json({ ok: false, error: "consent_required" }, { status: 422 });
  }

  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  if (!isDbConfigured && !emailConfigured) {
    console.error("[lead] Neither DATABASE_URL nor RESEND_API_KEY is set; lead was not stored.");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const needKey = str(body.need, 10);
  const lead: NewLead = {
    name,
    phone,
    site: str(body.site, 300) || null,
    need: NEEDS[needKey] ? needKey : null,
    lang: str(body.lang, 2) === "en" ? "en" : "ar",
    cta_source: str(body.cta_source, 80) || null,
    utm_source: str(body.utm_source, 200) || null,
    utm_medium: str(body.utm_medium, 200) || null,
    utm_campaign: str(body.utm_campaign, 200) || null,
    utm_content: str(body.utm_content, 200) || null,
    utm_term: str(body.utm_term, 200) || null,
    gclid: str(body.gclid, 200) || null,
    gbraid: str(body.gbraid, 200) || null,
    wbraid: str(body.wbraid, 200) || null,
    fbclid: str(body.fbclid, 200) || null,
    campaign_id: str(body.campaign_id, 200) || null,
    adgroup_id: str(body.adgroup_id, 200) || null,
    keyword: str(body.keyword, 200) || null,
    landing_page: str(body.landing_page, 500) || null,
    referrer: str(body.referrer, 500) || null,
    ip,
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300) || null,
    consent_at: new Date().toISOString(),
  };

  let stored = false;
  let emailed = false;

  // 1. The database is the source of truth.
  if (isDbConfigured) {
    try {
      await insertLead(lead);
      stored = true;
    } catch (err) {
      console.error("[lead] Store failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  // 2. Email notification. A failure is logged and does not fail a stored lead.
  if (emailConfigured) {
    const rows: [string, string][] = [
      ["Name", lead.name],
      ["Phone / WhatsApp", lead.phone],
      ["Website / store", lead.site ?? "—"],
      ["Needs", lead.need ? NEEDS[lead.need] : "—"],
      ["Page language", lead.lang === "en" ? "EN" : "AR"],
      ["Channel", channelOf(lead)],
      ["Form opened from", lead.cta_source ?? "—"],
      ["UTM source / medium", [lead.utm_source, lead.utm_medium].filter(Boolean).join(" / ") || "—"],
      ["UTM campaign", lead.utm_campaign ?? "—"],
      ["Keyword", lead.keyword ?? lead.utm_term ?? "—"],
      ["Landing page", lead.landing_page ?? "—"],
      ["Referrer", lead.referrer ?? "—"],
    ];
    try {
      emailed = await sendEmail(rows, lead.name);
    } catch (err) {
      console.error("[lead] Email failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  if (!stored && !emailed) {
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
