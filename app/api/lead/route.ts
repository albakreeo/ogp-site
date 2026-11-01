import { NextResponse } from "next/server";

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
  const site = str(body.site, 300);
  const need = NEEDS[str(body.need, 10)] ?? "—";
  const lang = str(body.lang, 2) === "en" ? "EN" : "AR";

  if (!name || !phone || !/^[+\d][\d\s()+-]{5,}$/.test(phone)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const to = process.env.LEAD_TO_EMAIL || "info@ogpdigital.com";
  const from = process.env.LEAD_FROM_EMAIL || "OGP Website <onboarding@resend.dev>";

  const rows: [string, string][] = [
    ["Name", name],
    ["Phone / WhatsApp", phone],
    ["Website / store", site || "—"],
    ["Needs", need],
    ["Page language", lang],
  ];
  const html =
    `<h2>New free-audit request</h2><table cellpadding="6">` +
    rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("") +
    `</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New audit request: ${name}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text());
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
