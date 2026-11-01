"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { assertAdmin } from "@/lib/admin-auth";
import { LEAD_STATUSES, deleteLead, updateLead, type LeadStatus } from "@/lib/leads-store";

const UUID = /^[0-9a-f-]{36}$/i;

export async function updateLeadAction(formData: FormData): Promise<void> {
  assertAdmin((await headers()).get("authorization"));
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase().slice(0, 30))
    .filter(Boolean)
    .slice(0, 10);

  if (!UUID.test(id)) throw new Error("Invalid lead id.");
  if (!LEAD_STATUSES.includes(status as LeadStatus)) throw new Error("Invalid status.");
  if (note.length > 1000) throw new Error("Note is too long (max 1000 characters).");

  await updateLead(id, status as LeadStatus, note, [...new Set(tags)]);
  revalidatePath("/admin/leads");
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  assertAdmin((await headers()).get("authorization"));
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) throw new Error("Invalid lead id.");
  await deleteLead(id);
  revalidatePath("/admin/leads");
}
