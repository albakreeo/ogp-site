// Basic Auth check for the lead admin. Used by proxy.ts (which challenges the
// browser) and, as defence in depth, inside every admin page, route handler and
// server action, so a misconfigured proxy can never expose lead data.
import { timingSafeEqual } from "node:crypto";

export const ADMIN_REALM = 'Basic realm="OGP leads", charset="UTF-8"';

export const isAdminAuthConfigured = Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function isAdminAuthorized(authorization: string | null | undefined): boolean {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password) return false;
  const [scheme, encoded] = (authorization ?? "").split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  if (idx < 0) return false;
  return safeEqual(decoded.slice(0, idx), user) && safeEqual(decoded.slice(idx + 1), password);
}

export function assertAdmin(authorization: string | null | undefined): void {
  if (!isAdminAuthorized(authorization)) throw new Error("Unauthorized");
}
