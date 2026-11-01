import { db, isDbConfigured } from "./db";
import { channelOf } from "./channel";

export { isDbConfigured };

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadRecord = {
  id: string;
  created_at: Date;
  name: string;
  phone: string;
  site: string | null;
  need: string | null;
  lang: string | null;
  status: LeadStatus;
  note: string | null;
  tags: string[];
  cta_source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbclid: string | null;
  campaign_id: string | null;
  adgroup_id: string | null;
  keyword: string | null;
  landing_page: string | null;
  referrer: string | null;
  ip: string | null;
  user_agent: string | null;
  consent_at: Date | string | null;
};

export type NewLead = Omit<LeadRecord, "id" | "created_at" | "status" | "note" | "tags">;

const COLS = [
  "name", "phone", "site", "need", "lang", "cta_source",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "gclid", "gbraid", "wbraid", "fbclid", "campaign_id", "adgroup_id", "keyword",
  "landing_page", "referrer", "ip", "user_agent", "consent_at",
] as const;

export async function insertLead(lead: NewLead): Promise<void> {
  const pool = await db();
  const values = COLS.map((c) => lead[c] ?? null);
  const params = COLS.map((_, i) => `$${i + 1}`).join(", ");
  await pool.query(`insert into leads (${COLS.join(", ")}) values (${params})`, values);
}

export type LeadFilter = { status?: LeadStatus; channel?: string; q?: string };

export type LeadWithChannel = LeadRecord & { channel: string };

export async function listLeads(filter: LeadFilter = {}, limit = 500): Promise<LeadWithChannel[]> {
  const pool = await db();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status) {
    params.push(filter.status);
    where.push(`status = $${params.length}`);
  }
  if (filter.q) {
    params.push(`%${filter.q}%`);
    const n = params.length;
    where.push(
      `(name ilike $${n} or phone ilike $${n} or site ilike $${n} or note ilike $${n} or utm_campaign ilike $${n} or keyword ilike $${n} or array_to_string(tags, ' ') ilike $${n})`,
    );
  }
  const { rows } = await pool.query<LeadRecord>(
    `select * from leads ${where.length ? `where ${where.join(" and ")}` : ""} order by created_at desc limit ${Math.min(limit, 5000)}`,
    params,
  );
  // The channel is derived (it is not a stored column), so it is filtered here.
  const withChannel = rows.map((r) => ({ ...r, channel: channelOf(r) }));
  return filter.channel ? withChannel.filter((r) => r.channel === filter.channel) : withChannel;
}

export async function leadSummary(): Promise<{
  total: number;
  last7: number;
  byStatus: Record<LeadStatus, number>;
  byChannel: { channel: string; count: number }[];
}> {
  const pool = await db();
  const { rows } = await pool.query<LeadRecord>("select * from leads");
  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  const ch = new Map<string, number>();
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  let last7 = 0;
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const c = channelOf(r);
    ch.set(c, (ch.get(c) ?? 0) + 1);
    if (new Date(r.created_at).getTime() >= weekAgo) last7++;
  }
  return {
    total: rows.length,
    last7,
    byStatus,
    byChannel: [...ch.entries()].map(([channel, count]) => ({ channel, count })).sort((a, b) => b.count - a.count),
  };
}

export async function updateLead(id: string, status: LeadStatus, note: string, tags: string[]): Promise<void> {
  const pool = await db();
  await pool.query("update leads set status = $2, note = $3, tags = $4 where id = $1", [
    id,
    status,
    note.trim() || null,
    tags,
  ]);
}

export async function deleteLead(id: string): Promise<void> {
  const pool = await db();
  await pool.query("delete from leads where id = $1", [id]);
}
