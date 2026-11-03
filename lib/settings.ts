// Editable site settings (SEO tags and page headings) stored in Postgres.
// Every read falls back to the defaults baked into the page when the database
// is missing or unreachable, so the public site never depends on it.
import { db, isDbConfigured } from "./db";

export type Settings = Record<string, string>;

export async function getSettings(): Promise<Settings> {
  if (!isDbConfigured) return {};
  try {
    const pool = await db();
    const { rows } = await pool.query<{ key: string; value: string }>("select key, value from site_settings");
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch (err) {
    console.error("[settings] read failed:", err instanceof Error ? err.message : "unknown");
    return {};
  }
}

/** Empty value = remove the override and go back to the default. */
export async function saveSettings(entries: Settings): Promise<void> {
  const pool = await db();
  for (const [key, raw] of Object.entries(entries)) {
    const value = raw.trim();
    if (!value) {
      await pool.query("delete from site_settings where key = $1", [key]);
    } else {
      await pool.query(
        `insert into site_settings (key, value) values ($1, $2)
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [key, value],
      );
    }
  }
}
