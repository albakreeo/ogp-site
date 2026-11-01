// Server-only Postgres access. The database is Neon from the Vercel Marketplace
// (free tier): connecting it to the project injects DATABASE_URL automatically.
import { Pool } from "pg";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const isDbConfigured = Boolean(url);

const SCHEMA = `
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  site text,
  need text,
  lang text,
  status text not null default 'new',
  note text,
  tags text[] not null default '{}',
  cta_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  gbraid text,
  wbraid text,
  fbclid text,
  campaign_id text,
  adgroup_id text,
  keyword text,
  landing_page text,
  referrer text,
  ip text,
  user_agent text
);
create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);
`;

let pool: Pool | undefined;
let ready: Promise<void> | undefined;

function getPool(): Pool {
  if (!url) throw new Error("DATABASE_URL is not configured");
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return pool;
}

/** Returns the pool once the table exists (created on first use, idempotent). */
export async function db(): Promise<Pool> {
  const p = getPool();
  ready ??= p.query(SCHEMA).then(() => undefined).catch((err) => {
    ready = undefined;
    throw err;
  });
  await ready;
  return p;
}
