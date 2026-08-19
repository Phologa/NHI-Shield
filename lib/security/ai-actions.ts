"use server";

import { requireSecurityContext } from "@/lib/security/context";
import { z } from "zod";

export type AiResult = { ok: boolean; answer?: string; error?: string };
const questionSchema = z.string().trim().min(2).max(2000);

export async function askSecurityAnalyst(_previous: AiResult, formData: FormData): Promise<AiResult> {
  try {
    const question = questionSchema.parse(formData.get("question")).toLowerCase();
    const context = await requireSecurityContext("view_security_data");
    const [findings, incidents, identities] = await Promise.all([
      context.supabase.from("findings").select("severity,status,risk_score").eq("organisation_id", context.organisationId).neq("status", "resolved"),
      context.supabase.from("incidents").select("severity,status").eq("organisation_id", context.organisationId).neq("status", "resolved"),
      context.supabase.from("machine_identities").select("owner_name,privilege_level").eq("organisation_id", context.organisationId),
    ]);
    if (findings.error || incidents.error || identities.error) return { ok: false, error: "I could not safely read this organisation’s data." };
    const findingRows = findings.data ?? []; const incidentRows = incidents.data ?? []; const identityRows = identities.data ?? [];
    const critical = findingRows.filter((item) => item.severity === "critical" || item.severity === "high").length;
    const openIncidents = incidentRows.length; const missingOwners = identityRows.filter((item) => !item.owner_name).length;
    let next = "Start on [Overview](/overview), then review [Risks](/findings) and [Incidents](/incidents).";
    if (question.includes("add") || question.includes("csv") || question.includes("import")) next = "Go to [Add company data](/import). Choose a data type, paste the matching CSV, review the preview, then confirm the import.";
    if (question.includes("incident")) next = `There are ${openIncidents} active incidents. Open [Incidents](/incidents) to review their deterministic detection timeline.`;
    if (question.includes("risk") || question.includes("finding")) next = `There are ${findingRows.length} active risks, including ${critical} high or critical items. Open [Risks](/findings) to inspect recorded evidence.`;
    const answer = `Facts\n• ${identityRows.length} app or system accounts are recorded.\n• ${findingRows.length} active risks and ${openIncidents} active incidents are recorded.\n• ${missingOwners} accounts do not have an owner recorded.\n\nDeterministic assessment\nThese counts come directly from tenant-scoped NHI Shield records. Existing risk scores are rule-based; confidence is evidence quality, not probability of compromise.\n\nNext step\n${next}\n\nAI interpretation\nNot configured. This safe product-guide mode does not send tenant data to an external AI provider or invent an answer.`;
    return { ok: true, answer };
  } catch { return { ok: false, error: "Please enter a short question. No external AI request was made." }; }
}
