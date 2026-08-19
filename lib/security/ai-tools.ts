import type { SecurityContext } from "@/lib/security/context";
import { hasPermission } from "@/lib/security/permissions";

export type AiCitation = { label: string; href: string; kind: "finding" | "incident" | "identity" | "resource" };
export type AiNavigationAction = { label: string; href: string };
const LIMIT = 25;
export function untrustedText(value: unknown, maximum = 500) { return String(value ?? "").replace(/[\u0000-\u001f]/g, " ").slice(0, maximum); }
export function getNavigationActions(context: Pick<SecurityContext,"role">): AiNavigationAction[] {
  const actions = [{ label: "Open Overview", href: "/overview" }, { label: "Open Risks", href: "/findings" }, { label: "Open Incidents", href: "/incidents" }, { label: "View system accounts", href: "/machine-identities" }];
  if (hasPermission(context.role, "manage_security_inventory")) actions.push({ label: "Go to Import", href: "/import" });
  if (hasPermission(context.role, "manage_organisation")) actions.push({ label: "Open Settings & Members", href: "/settings" });
  return actions;
}
async function rows(context: SecurityContext, table: string, columns: string, order = "created_at") { const query = context.supabase.from(table).select(columns).eq("organisation_id", context.organisationId).order(order, { ascending: false }).limit(LIMIT); const { data, error } = await query; if (error) throw new Error("AI_TOOL_READ_FAILED"); return data ?? []; }
export async function getSecuritySummary(context: SecurityContext) { const result = await Promise.all([rows(context,"findings","id,severity,status,risk_score,title"),rows(context,"incidents","id,severity,status,title"),rows(context,"machine_identities","id,name,owner_name,privilege_level,status")]); const findings=result[0] as unknown as Array<Record<string,unknown>>; const incidents=result[1] as unknown as Array<Record<string,unknown>>; const identities=result[2] as unknown as Array<Record<string,unknown>>; return { accountCount: identities.length, activeRiskCount: findings.filter((item) => item.status !== "resolved").length, highCriticalRiskCount: findings.filter((item) => item.status !== "resolved" && ["high","critical"].includes(String(item.severity))).length, activeIncidentCount: incidents.filter((item) => item.status !== "resolved").length, accountsWithoutOwners: identities.filter((item) => !item.owner_name).length }; }
export const listFindings = (context: SecurityContext) => rows(context,"findings","id,title,description,severity,status,risk_score,confidence,machine_identity_id,resource_id,last_detected_at","last_detected_at");
export const listIncidents = (context: SecurityContext) => rows(context,"incidents","id,title,description,severity,status,machine_identity_id,resource_id,opened_at,last_activity_at","last_activity_at");
export const listMachineIdentities = (context: SecurityContext) => rows(context,"machine_identities","id,name,identity_type,provider,environment,owner_name,privilege_level,status,last_seen_at","updated_at");
export const listResources = (context: SecurityContext) => rows(context,"resources","id,name,resource_type,provider,environment,sensitivity","updated_at");
export const getAccessRelationships = (context: SecurityContext) => rows(context,"access_relationships","id,machine_identity_id,resource_id,access_level,privileged,last_observed_at","updated_at");
export const getRecentActivity = (context: SecurityContext) => rows(context,"activity_events","id,machine_identity_id,resource_id,action,outcome,source,occurred_at","occurred_at");
export const getEvidence = (context: SecurityContext) => rows(context,"finding_evidence","id,finding_id,evidence_type,summary,source,observed_at","observed_at");
export const getRemediationContext = (context: SecurityContext) => rows(context,"remediation_actions","id,finding_id,incident_id,title,rationale,action_type,execution_mode,status,created_at");
export async function collectAiContext(context: SecurityContext) { const [summary,findings,incidents,identities,resources,access,activity,evidence,remediation] = await Promise.all([getSecuritySummary(context),listFindings(context),listIncidents(context),listMachineIdentities(context),listResources(context),getAccessRelationships(context),getRecentActivity(context),getEvidence(context),getRemediationContext(context)]); const clean = JSON.parse(JSON.stringify({ summary, findings, incidents, identities, resources, access, activity, evidence, remediation }),(_key,value) => typeof value === "string" ? untrustedText(value) : value); return clean; }
export function citationsFromContext(bundle: Awaited<ReturnType<typeof collectAiContext>>): AiCitation[] { return [...bundle.findings.slice(0,5).map((item: {id:string;title:string}) => ({ label: untrustedText(item.title,100), href: `/findings/${item.id}`, kind: "finding" as const })),...bundle.incidents.slice(0,5).map((item: {id:string;title:string}) => ({ label: untrustedText(item.title,100), href: `/incidents/${item.id}`, kind: "incident" as const }))]; }
