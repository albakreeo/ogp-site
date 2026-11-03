import { headers } from "next/headers";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { isDbConfigured, listLeads, LEAD_STATUSES, type LeadWithChannel } from "@/lib/leads-store";

export const dynamic = "force-dynamic";

const DAY = 24 * 3600 * 1000;
const TZ = "Asia/Riyadh";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", won: "Won", lost: "Lost" };
const NEED_LABEL: Record<string, string> = { ads: "Ads and marketing", web: "Website or app", both: "Both" };

function tally(items: (string | null | undefined)[], top = 6) {
  const m = new Map<string, number>();
  for (const i of items) if (i) m.set(i, (m.get(i) ?? 0) + 1);
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, top);
}

function host(u: string | null) {
  if (!u) return null;
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; }
}

function Bars({ data, empty = "No data yet." }: { data: { name: string; count: number }[]; empty?: string }) {
  if (!data.length) return <p className="none">{empty}</p>;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar" key={d.name}>
          <span className="name" title={d.name}>{d.name}</span>
          <span className="track"><span className="fill" style={{ width: `${Math.max(4, (d.count / max) * 100)}%` }} /></span>
          <span className="n">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev && !now) return null;
  if (!prev) return <i className="up">new</i>;
  const pct = Math.round(((now - prev) / prev) * 100);
  if (pct === 0) return <i>0%</i>;
  return <i className={pct > 0 ? "up" : "down"}>{pct > 0 ? "+" : ""}{pct}%</i>;
}

function DailyChart({ counts }: { counts: { day: string; n: number }[] }) {
  const max = Math.max(1, ...counts.map((c) => c.n));
  const W = 600, H = 150, pad = 18, bw = (W - pad) / counts.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Leads per day, last 30 days" preserveAspectRatio="none">
      {counts.map((c, i) => {
        const h = c.n ? Math.max(3, (c.n / max) * (H - pad - 14)) : 1;
        return (
          <g key={c.day}>
            <title>{`${c.day}: ${c.n}`}</title>
            <rect x={pad + i * bw + 1} y={H - pad - h} width={Math.max(2, bw - 3)} height={h} rx={2} opacity={c.n ? 1 : 0.25} />
          </g>
        );
      })}
      <text x={pad} y={H - 4}>{counts[0].day.slice(5)}</text>
      <text x={W - 4} y={H - 4} textAnchor="end">{counts[counts.length - 1].day.slice(5)}</text>
      <text x={0} y={12}>{max}</text>
    </svg>
  );
}

export default async function Dashboard() {
  if (!isAdminAuthorized((await headers()).get("authorization"))) {
    return <p className="muted">Authentication required.</p>;
  }
  if (!isDbConfigured) {
    return (
      <div className="card narrow">
        <h1>Not connected to a database</h1>
        <p className="muted">Add a Neon Postgres database to the Vercel project, then redeploy.</p>
      </div>
    );
  }

  let leads: LeadWithChannel[];
  try {
    leads = await listLeads({}, 5000);
  } catch (err) {
    return (
      <div className="card narrow">
        <h1>Could not load data</h1>
        <p className="muted">{err instanceof Error ? err.message : "Unknown error."} Reload the page.</p>
      </div>
    );
  }

  const now = Date.now();
  const at = (l: LeadWithChannel) => new Date(l.created_at).getTime();
  const last7 = leads.filter((l) => at(l) >= now - 7 * DAY).length;
  const prev7 = leads.filter((l) => at(l) >= now - 14 * DAY && at(l) < now - 7 * DAY).length;
  const last30 = leads.filter((l) => at(l) >= now - 30 * DAY).length;
  const prev30 = leads.filter((l) => at(l) >= now - 60 * DAY && at(l) < now - 30 * DAY).length;
  const fresh = leads.filter((l) => l.status === "new").length;
  const won = leads.filter((l) => l.status === "won").length;
  const winRate = leads.length ? Math.round((won / leads.length) * 100) : 0;

  const perDay = new Map<string, number>();
  for (const l of leads) {
    if (at(l) >= now - 30 * DAY) perDay.set(dayKey(new Date(l.created_at)), (perDay.get(dayKey(new Date(l.created_at))) ?? 0) + 1);
  }
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = dayKey(new Date(now - (29 - i) * DAY));
    return { day, n: perDay.get(day) ?? 0 };
  });

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Leads from the website form. Times in Riyadh time (GMT+3).</p>
        </div>
        <a href="/admin/leads">Open all leads →</a>
      </div>

      <div className="kpis">
        <div className="card kpi"><b>{leads.length}</b><span>Total leads</span></div>
        <div className="card kpi"><b>{last7}<Delta now={last7} prev={prev7} /></b><span>Last 7 days (vs previous 7)</span></div>
        <div className="card kpi"><b>{last30}<Delta now={last30} prev={prev30} /></b><span>Last 30 days (vs previous 30)</span></div>
        <div className="card kpi"><b>{fresh}</b><span>New, not contacted yet</span></div>
        <div className="card kpi"><b>{winRate}%</b><span>Won ({won} of {leads.length})</span></div>
      </div>

      <div className="card">
        <h2>Leads per day, last 30 days</h2>
        <DailyChart counts={days} />
      </div>

      <div className="grid2">
        <div className="card"><h2>Channels</h2><Bars data={tally(leads.map((l) => l.channel), 8)} /></div>
        <div className="card">
          <h2>Pipeline</h2>
          <Bars data={LEAD_STATUSES.map((s) => ({ name: STATUS_LABEL[s], count: leads.filter((l) => l.status === s).length }))} />
        </div>
        <div className="card"><h2>Campaigns (UTM)</h2><Bars data={tally(leads.map((l) => l.utm_campaign))} empty="No campaign labels yet. Add ?utm_campaign=… to your ad links." /></div>
        <div className="card"><h2>Keywords</h2><Bars data={tally(leads.map((l) => l.keyword || l.utm_term))} empty="No keywords yet. Google Ads: add &keyword={keyword} to the tracking template." /></div>
        <div className="card"><h2>What visitors need</h2><Bars data={tally(leads.map((l) => (l.need ? NEED_LABEL[l.need] ?? l.need : null)))} /></div>
        <div className="card"><h2>Form opened from</h2><Bars data={tally(leads.map((l) => l.cta_source))} /></div>
        <div className="card"><h2>Referring sites</h2><Bars data={tally(leads.map((l) => host(l.referrer)))} empty="No referrers yet." /></div>
        <div className="card"><h2>Page language</h2><Bars data={tally(leads.map((l) => (l.lang === "en" ? "English" : "Arabic")))} /></div>
      </div>

      <p className="muted small">
        Website visits are not counted here, only form submissions. To see traffic and conversion rate, connect Google
        Analytics or Tag Manager.
      </p>
    </div>
  );
}
