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
    const payload = rows.map((row) => row.parsed!).map((item) => entity === "machine_identities"
      ? { organisation_id: context.organisationId, name: item.name, identity_type: item.identityType, provider: item.provider || null, external_id: item.externalId || null, environment: item.environment, owner_name: item.ownerName || null, owner_email: item.ownerEmail || null, privilege_level: item.privilegeLevel, status: item.status, description: item.description || null, source_type: "csv_import" }
      : entity === "resources" ? { organisation_id: context.organisationId, name: item.name, resource_type: item.resourceType, provider: item.provider || null, external_id: item.externalId || null, environment: item.environment, sensitivity: item.sensitivity, description: item.description || null }
      : entity === "credentials" ? { organisation_id: context.organisationId, machine_identity_id: item.machineIdentityId, credential_type: item.credentialType, label: item.label, status: item.status, last_rotated_at: item.lastRotatedAt || null, expires_at: item.expiresAt || null, fingerprint_reference: item.fingerprintReference || null }
      : { organisation_id: context.organisationId, machine_identity_id: item.machineIdentityId, resource_id: item.resourceId, access_level: item.accessLevel, privileged: item.privileged, source: "csv_import" });
    const { data, error } = await context.supabase.rpc("import_security_csv", { target_entity: entity, import_rows: payload });
    if (error) return { ok: false, errors: ["Nothing was imported. Check for duplicate records or references to records that do not exist in this company."] };
    const result = (data ?? {}) as { created?: number; updated?: number };
    revalidatePath("/machine-identities"); revalidatePath("/access-graph"); revalidatePath("/overview"); revalidatePath("/data-sources");
    return { ok: true, message: `Import complete: ${result.created ?? payload.length} created and ${result.updated ?? 0} updated.` };
  } catch (error) { return { ok: false, errors: [error instanceof Error ? error.message : "The import could not be completed. Try again."] }; }
}
