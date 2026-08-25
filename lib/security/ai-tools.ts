import type { SecurityContext } from "@/lib/security/context";
import { hasPermission } from "@/lib/security/permissions";
import type { AiAction, AiFact, AiReference } from "@/lib/security/ai-types";

const LIMIT = 30;
export function untrustedText(value: unknown, maximum = 500) { return String(value ?? "").replace(/[\u0000-\u001f]/g, " ").slice(0, maximum); }
export function getNavigationActions(context: Pick<SecurityContext, "role">): AiAction[] {
  const actions: AiAction[] = [{ label: "Open Overview", href: "/overview" }, { label: "View Findings", href: "/findings" }, { label: "View Incidents", href: "/incidents" }, { label: "View Machine Identities", href: "/machine-identities" }];
  if (hasPermission(context.role, "manage_security_inventory")) actions.push({ label: "Open Import", href: "/import" });
  return actions;
}

type Row = Record<string, unknown>;
export type AiDataBundle = { identities: Row[]; credentials: Row[]; resources: Row[]; relationships: Row[]; findings: Row[]; evidence: Row[]; incidents: Row[]; timeline: Row[]; activity: Row[]; productKnowledge: Row[] };
export interface AiReadRepository { collect(context: SecurityContext): Promise<AiDataBundle>; }
async function read(context: SecurityContext, table: string, columns: string, order: string) {
  const { data, error } = await context.supabase.from(table).select(columns).eq("organisation_id", context.organisationId).order(order, { ascending: false }).limit(LIMIT);
  if (error) throw new Error(`AI_READ_${table.toUpperCase()}_FAILED`);
  return (data ?? []) as unknown as Row[];
}
export const supabaseAiReadRepository: AiReadRepository = {
  async collect(context) {
    const [identities, credentials, resources, relationships, findings, evidence, incidents, timeline, activity] = await Promise.all([
      read(context, "machine_identities", "id,name,identity_type,provider,environment,owner_name,privilege_level,status,last_seen_at,updated_at", "updated_at"),
      read(context, "credentials", "id,machine_identity_id,credential_type,label,status,issued_at,last_rotated_at,expires_at,last_observed_at,provenance", "updated_at"),
      read(context, "resources", "id,name,resource_type,provider,environment,sensitivity,updated_at", "updated_at"),
      read(context, "access_relationships", "id,machine_identity_id,resource_id,access_level,privileged,last_observed_at,updated_at", "updated_at"),
      read(context, "findings", "id,title,description,finding_type,severity,status,risk_score,confidence,machine_identity_id,resource_id,last_detected_at", "last_detected_at"),
      read(context, "finding_evidence", "id,finding_id,evidence_type,summary,source,observed_at", "observed_at"),
      read(context, "incidents", "id,title,description,severity,status,machine_identity_id,resource_id,opened_at,last_activity_at", "last_activity_at"),
      read(context, "incident_events", "id,incident_id,activity_event_id,finding_id,event_type,note,created_at", "created_at"),
      read(context, "activity_events", "id,machine_identity_id,resource_id,action,outcome,source,occurred_at", "occurred_at"),
    ]);
    const productKnowledge = [
      { topic: "inventory_import", guidance: "Use /import to upload the documented CSV inventory format. Import is available only to roles with manage_security_inventory." },
      { topic: "findings", guidance: "Use /findings to review deterministic severity, risk score and evidence." },
      { topic: "incidents", guidance: "Use /incidents to review detection-created incidents and timelines." },
    ];
    return sanitizeBundle({ identities, credentials, resources, relationships, findings, evidence, incidents, timeline, activity, productKnowledge });
  },
};
export function sanitizeBundle(bundle: AiDataBundle): AiDataBundle { return JSON.parse(JSON.stringify(bundle), (_key, value) => typeof value === "string" ? untrustedText(value) : value) as AiDataBundle; }
const reference = (kind: AiReference["kind"], row: Row, label: string, route?: string): AiReference => ({ key: `${kind}:${row.id}`, kind, id: String(row.id), label: untrustedText(label, 120), route });
export function buildGrounding(bundle: AiDataBundle) {
  const references: AiReference[] = []; const facts: AiFact[] = []; const deterministicAssessment: AiFact[] = [];
  const add = (item: AiReference, text: string, deterministic = false) => { references.push(item); (deterministic ? deterministicAssessment : facts).push({ text, referenceKeys: [item.key] }); };
  for (const row of bundle.findings) add(reference("finding", row, String(row.title), `/findings/${row.id}`), `${row.title}: severity ${row.severity}, risk score ${row.risk_score}, status ${row.status}.`, true);
  for (const row of bundle.evidence) add(reference("evidence", row, `Evidence ${String(row.id).slice(0, 8)}`), `${row.evidence_type}: ${row.summary}`);
  for (const row of bundle.incidents) add(reference("incident", row, String(row.title), `/incidents/${row.id}`), `${row.title}: severity ${row.severity}, status ${row.status}, last activity ${row.last_activity_at}.`, true);
  for (const row of bundle.identities) add(reference("machine_identity", row, String(row.name), `/machine-identities/${row.id}`), `${row.name}: ${row.privilege_level} privilege, ${row.status} status, owner ${row.owner_name || "not recorded"}.`);
  for (const row of bundle.credentials) add(reference("credential", row, String(row.label)), `${row.label}: ${row.credential_type} metadata, status ${row.status}, expires ${row.expires_at || "not recorded"}.`);
  for (const row of bundle.resources) add(reference("resource", row, String(row.name)), `${row.name}: ${row.sensitivity} sensitivity ${row.resource_type}.`);
  for (const row of bundle.relationships) add(reference("access_relationship", row, `Access ${String(row.id).slice(0, 8)}`), `Access level ${row.access_level}; privileged ${row.privileged ? "yes" : "no"}.`);
  for (const row of bundle.activity) add(reference("activity", row, `Activity ${String(row.id).slice(0, 8)}`), `${row.action}: ${row.outcome} at ${row.occurred_at}.`);
  return { facts, deterministicAssessment, references: [...new Map(references.map((item) => [item.key, item])).values()] };
}
