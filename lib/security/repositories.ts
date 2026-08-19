import type { SecurityContext } from "@/lib/security/context";

export function canLinkOrganisationRecords(identityOrganisationId: string, resourceOrganisationId: string) { return identityOrganisationId === resourceOrganisationId; }

export async function listMachineIdentities(context: SecurityContext) { const { data, error } = await context.supabase.from("machine_identities").select("*").eq("organisation_id", context.organisationId).order("updated_at", { ascending: false }); if (error) throw new Error("IDENTITIES_READ_FAILED"); return data ?? []; }
export async function getMachineIdentity(context: SecurityContext, id: string) { const { data, error } = await context.supabase.from("machine_identities").select("*").eq("organisation_id", context.organisationId).eq("id", id).maybeSingle(); if (error) throw new Error("IDENTITY_READ_FAILED"); return data; }
export async function listCredentials(context: SecurityContext, identityId: string) { const { data, error } = await context.supabase.from("credentials").select("*").eq("organisation_id", context.organisationId).eq("machine_identity_id", identityId).order("created_at", { ascending: false }); if (error) throw new Error("CREDENTIALS_READ_FAILED"); return data ?? []; }
export async function listResources(context: SecurityContext) { const { data, error } = await context.supabase.from("resources").select("*").eq("organisation_id", context.organisationId).order("updated_at", { ascending: false }); if (error) throw new Error("RESOURCES_READ_FAILED"); return data ?? []; }
export async function listAccessRelationships(context: SecurityContext) { const { data, error } = await context.supabase.from("access_relationships").select("*, machine_identities(name, privilege_level), resources(name, resource_type, environment, sensitivity)").eq("organisation_id", context.organisationId).order("updated_at", { ascending: false }); if (error) throw new Error("ACCESS_READ_FAILED"); return data ?? []; }
export async function listFindings(context: SecurityContext) { const { data, error } = await context.supabase.from("findings").select("*, machine_identities(name), resources(name), finding_evidence(count)").eq("organisation_id", context.organisationId).order("last_detected_at", { ascending: false }); if (error) throw new Error("FINDINGS_READ_FAILED"); return data ?? []; }
export async function getFinding(context: SecurityContext, id: string) { const { data, error } = await context.supabase.from("findings").select("*, machine_identities(name), resources(name), finding_evidence(*)").eq("organisation_id", context.organisationId).eq("id", id).maybeSingle(); if (error) throw new Error("FINDING_READ_FAILED"); return data; }
export async function getOverviewCounts(context: SecurityContext) {
  const [identities, credentials, resources, findings] = await Promise.all([
    context.supabase.from("machine_identities").select("id, owner_name, privilege_level", { count: "exact", head: false }).eq("organisation_id", context.organisationId),
    context.supabase.from("credentials").select("id", { count: "exact", head: true }).eq("organisation_id", context.organisationId),
    context.supabase.from("resources").select("id", { count: "exact", head: true }).eq("organisation_id", context.organisationId),
    context.supabase.from("findings").select("severity, status").eq("organisation_id", context.organisationId).neq("status", "resolved"),
  ]);
  if (identities.error || credentials.error || resources.error || findings.error) throw new Error("OVERVIEW_READ_FAILED");
  const identityRows = identities.data ?? []; const findingRows = findings.data ?? [];
  return { identities: identities.count ?? identityRows.length, credentials: credentials.count ?? 0, resources: resources.count ?? 0, activeFindings: findingRows.length, criticalHighFindings: findingRows.filter((row) => row.severity === "critical" || row.severity === "high").length, identitiesWithoutOwners: identityRows.filter((row) => !row.owner_name).length, privilegedIdentities: identityRows.filter((row) => row.privilege_level === "high" || row.privilege_level === "critical").length };
}