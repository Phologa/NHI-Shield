"use server";
import { revalidatePath } from "next/cache";
import { requireSecurityContext } from "@/lib/security/context";
import { importEntitySchema, validateCsv } from "@/lib/security/csv-import";

export type ImportResult = { ok: boolean; message?: string; errors?: string[] };
export async function importCsv(_previous: ImportResult, formData: FormData): Promise<ImportResult> {
  try {
    const context = await requireSecurityContext("manage_security_inventory");
    const entity = importEntitySchema.parse(formData.get("entity")); const text = String(formData.get("csv") ?? "");
    if (formData.get("confirmed") !== "yes") return { ok: false, errors: ["Preview the file and confirm the import first."] };
    const rows = validateCsv(entity, text);
    if (rows.length > 1000) return { ok: false, errors: ["This import has more than 1,000 rows. Split it into smaller files."] };
    const invalid = rows.filter((row) => !row.valid);
    if (invalid.length) return { ok: false, errors: invalid.flatMap((row) => row.errors.map((error) => `Row ${row.row}: ${error}`)).slice(0, 50) };
    const payload = rows.map((row) => row.parsed!).map((item) => entity === "security_inventory"
      ? { organisation_id: context.organisationId, name: item.name, identity_type: item.identityType, provider: item.provider, external_id: item.externalId, environment: item.environment, owner_name: item.ownerName || null, owner_email: item.ownerEmail || null, privilege_level: item.privilegeLevel, status: item.status, last_seen_at: item.lastSeenAt || null, description: item.description || null, resource_name: item.resourceName || null, resource_type: item.resourceType || null, resource_provider: item.resourceProvider || null, resource_external_id: item.resourceExternalId || null, resource_environment: item.resourceEnvironment || null, resource_sensitivity: item.resourceSensitivity || null, resource_description: item.resourceDescription || null, access_level: item.accessLevel || null, access_privileged: item.accessPrivileged, credential_type: item.credentialType || null, credential_label: item.credentialLabel || null, credential_status: item.credentialStatus || null, credential_last_rotated_at: item.credentialLastRotatedAt || null, credential_expires_at: item.credentialExpiresAt || null }
      : entity === "machine_identities" ? { organisation_id: context.organisationId, name: item.name, identity_type: item.identityType, provider: item.provider || null, external_id: item.externalId || null, environment: item.environment, owner_name: item.ownerName || null, owner_email: item.ownerEmail || null, privilege_level: item.privilegeLevel, status: item.status, description: item.description || null, source_type: "csv_import" }
      : entity === "resources" ? { organisation_id: context.organisationId, name: item.name, resource_type: item.resourceType, provider: item.provider || null, external_id: item.externalId || null, environment: item.environment, sensitivity: item.sensitivity, description: item.description || null }
      : entity === "credentials" ? { organisation_id: context.organisationId, machine_identity_id: item.machineIdentityId, credential_type: item.credentialType, label: item.label, status: item.status, last_rotated_at: item.lastRotatedAt || null, expires_at: item.expiresAt || null, fingerprint_reference: item.fingerprintReference || null }
      : { organisation_id: context.organisationId, machine_identity_id: item.machineIdentityId, resource_id: item.resourceId, access_level: item.accessLevel, privileged: item.privileged, source: "csv_import" });
    const { data, error } = entity === "security_inventory" ? await context.supabase.rpc("import_security_inventory_csv", { import_rows: payload }) : await context.supabase.rpc("import_security_csv", { target_entity: entity, import_rows: payload });
    if (error) return { ok: false, errors: ["Nothing was imported. Check for duplicate records or references to records that do not exist in this company."] };
    const result = (data ?? {}) as { processed?: number; relationships?: number; credentials?: number };
    revalidatePath("/machine-identities"); revalidatePath("/access-graph"); revalidatePath("/overview"); revalidatePath("/data-sources");
    return { ok: true, message: entity === "security_inventory" ? `Import complete: ${result.processed ?? payload.length} rows processed, ${result.relationships ?? 0} access relationships mapped, and ${result.credentials ?? 0} credential metadata records linked. Analysis is ready to run.` : `Import complete: ${result.processed ?? payload.length} rows created or updated.` };
  } catch (error) { return { ok: false, errors: [error instanceof Error ? error.message : "The import could not be completed. Try again."] }; }
}
