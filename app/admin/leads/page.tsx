import { headers } from "next/headers";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  LEAD_STATUSES,
  isDbConfigured,
  leadSummary,
  listLeads,
  type LeadStatus,
  type LeadWithChannel,
} from "@/lib/leads-store";
import { deleteLeadAction, updateLeadAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

const NEED_LABEL: Record<string, string> = {
  ads: "Ads and marketing",
  web: "Website or app",
  both: "Both",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Riyadh",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const isStatus = (v: string | undefined): v is LeadStatus => LEAD_STATUSES.includes(v as LeadStatus);

function href(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/admin/leads?${s}` : "/admin/leads";
}

function waHref(phone: string) {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  if (!v) return null;
  return (
    <div className="kv">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Tracking({ lead }: { lead: LeadWithChannel }) {
  const clicks = [
    lead.gclid && ["gclid", lead.gclid],
    lead.gbraid && ["gbraid", lead.gbraid],
    lead.wbraid && ["wbraid", lead.wbraid],
    lead.fbclid && ["fbclid", lead.fbclid],
  ].filter(Boolean) as [string, string][];
  return (
    <details className="trk">
      <summary>Tracking details</summary>
      <dl>
        <Row k="UTM source" v={lead.utm_source} />
        <Row k="UTM medium" v={lead.utm_medium} />
        <Row k="UTM campaign" v={lead.utm_campaign} />
        <Row k="UTM content" v={lead.utm_content} />
        <Row k="UTM term" v={lead.utm_term} />
        <Row k="Keyword" v={lead.keyword} />
        <Row k="Campaign id" v={lead.campaign_id} />
        <Row k="Ad group id" v={lead.adgroup_id} />
        {clicks.map(([k, v]) => (
          <Row key={k} k={`Click id (${k})`} v={v} />
        ))}
        <Row k="Form opened from" v={lead.cta_source} />
        <Row k="Landing page" v={lead.landing_page} />
        <Row k="Referrer" v={lead.referrer} />
        <Row k="Page language" v={lead.lang === "en" ? "English" : "Arabic"} />
        <Row k="Consent given" v={lead.consent_at ? dateFormat.format(new Date(lead.consent_at)) : null} />
        <Row k="IP" v={lead.ip} />
        <Row k="Browser" v={lead.user_agent} />
      </dl>
    </details>
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; channel?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = isStatus(sp.status) ? sp.status : undefined;
  const channel = sp.channel || undefined;
  const q = (sp.q ?? "").trim().slice(0, 80) || undefined;

  // Defence in depth: the proxy already challenged the browser.
  if (!isAdminAuthorized((await headers()).get("authorization"))) {
    return <p className="muted">Authentication required.</p>;
  }

  if (!isDbConfigured) {
    return (
      <div className="card narrow">
        <h1>Admin is not connected to a database</h1>
        <p className="muted">
          Add a Neon Postgres database to this Vercel project (Storage tab). It sets{" "}
          <code>DATABASE_URL</code> automatically. Then redeploy.
        </p>
      </div>
    );
  }

  let leads: LeadWithChannel[];
  let summary: Awaited<ReturnType<typeof leadSummary>>;
  try {
    leads = await listLeads({ status, channel, q });
    summary = await leadSummary();
  } catch (err) {
    return (
      <div className="card narrow">
        <h1>Could not load leads</h1>
        <p className="muted">{err instanceof Error ? err.message : "Unknown error."} Reload the page.</p>
      </div>
    );
  }

  const tabs: { key: LeadStatus | undefined; label: string; count: number }[] = [
    { key: undefined, label: "All", count: summary.total },
    ...LEAD_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s], count: summary.byStatus[s] })),
  ];

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h1>Leads</h1>
          <p className="muted">Newest first. Times in Riyadh time (GMT+3).</p>
        </div>
        <form className="search" action="/admin/leads" method="get">
          {status && <input type="hidden" name="status" value={status} />}
          {channel && <input type="hidden" name="channel" value={channel} />}
          <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search name, phone, campaign, tag…" aria-label="Search leads" />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="stats">
        <div className="card stat"><b>{summary.total}</b><span>Total leads</span></div>
        <div className="card stat"><b>{summary.last7}</b><span>Last 7 days</span></div>
        <div className="card stat"><b>{summary.byStatus.new}</b><span>New, not contacted</span></div>
        <div className="card stat"><b>{summary.byStatus.won}</b><span>Won</span></div>
      </div>

      {summary.byChannel.length > 0 && (
        <div className="card">
          <h2>Where leads come from</h2>
          <div className="chips">
            <a href={href({ status, q })} className={!channel ? "chip on" : "chip"}>All channels</a>
            {summary.byChannel.map((c) => (
              <a key={c.channel} href={href({ status, q, channel: c.channel })} className={channel === c.channel ? "chip on" : "chip"}>
                {c.channel} <span>{c.count}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <nav aria-label="Filter by status" className="tabs">
        {tabs.map((t) => (
          <a key={t.label} href={href({ status: t.key, channel, q })} aria-current={t.key === status ? "page" : undefined} className={t.key === status ? "tab on" : "tab"}>
            {t.label} <span>{t.count}</span>
          </a>
        ))}
      </nav>

      {leads.length === 0 ? (
        <div className="card empty">
          <h2>{status || channel || q ? "No leads match these filters" : "No leads yet"}</h2>
          <p className="muted">Every request sent through the site form appears here.</p>
        </div>
      ) : (
        <div className="list">
          {leads.map((lead) => (
            <article key={lead.id} className="card lead">
              <div className="lead-main">
                <div className="lead-id">
                  <time className="muted">{dateFormat.format(new Date(lead.created_at))}</time>
                  <h3>{lead.name}</h3>
                  <p>
                    <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>{lead.phone}</a>
                    {" · "}
                    <a href={waHref(lead.phone)} target="_blank" rel="noopener" className="wa">WhatsApp</a>
                  </p>
                  {lead.site && (
                    <p className="clip">
                      <a href={/^https?:\/\//i.test(lead.site) ? lead.site : `https://${lead.site}`} target="_blank" rel="noopener noreferrer">{lead.site}</a>
                    </p>
                  )}
                  {lead.need && <p className="muted">{NEED_LABEL[lead.need] ?? lead.need}</p>}
                </div>

                <div className="lead-src">
                  <span className="badge">{lead.channel}</span>
                  {lead.utm_campaign && <p><span className="muted">Campaign</span> {lead.utm_campaign}</p>}
                  {(lead.keyword || lead.utm_term) && <p><span className="muted">Keyword</span> {lead.keyword ?? lead.utm_term}</p>}
                  {(lead.utm_source || lead.utm_medium) && (
                    <p><span className="muted">UTM</span> {[lead.utm_source, lead.utm_medium].filter(Boolean).join(" / ")}</p>
                  )}
                  {lead.cta_source && <p><span className="muted">Form from</span> {lead.cta_source}</p>}
                  <Tracking lead={lead} />
                </div>

                <form action={updateLeadAction} className="lead-edit">
                  <input type="hidden" name="id" value={lead.id} />
                  <label>
                    <span>Status</span>
                    <select name="status" defaultValue={lead.status}>
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Tags (comma separated)</span>
                    <input name="tags" defaultValue={lead.tags.join(", ")} maxLength={200} placeholder="vip, call-back, spam…" />
                  </label>
                  <label>
                    <span>Note</span>
                    <textarea name="note" rows={2} maxLength={1000} defaultValue={lead.note ?? ""} />
                  </label>
                  <div className="row">
                    <button type="submit">Save</button>
                  </div>
                </form>
              </div>
              <form action={deleteLeadAction} className="del">
                <input type="hidden" name="id" value={lead.id} />
                <button type="submit" className="link-danger">Delete</button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
