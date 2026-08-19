import { z } from "zod";
import { accessRelationshipSchema, credentialMetadataSchema, machineIdentitySchema, resourceSchema } from "@/lib/validation/security";

export const importEntitySchema = z.enum(["machine_identities", "credentials", "resources", "access_relationships"]);
export type ImportEntity = z.infer<typeof importEntitySchema>;
export type CsvRow = { row: number; values: Record<string, string> };
export type ValidatedCsvRow = CsvRow & { valid: boolean; errors: string[]; parsed?: Record<string, unknown> };

const forbiddenTerms = ["password", "secret", "token", "api_key", "apikey", "private_key", "client_secret", "credential_value", "secret_value"];
const friendlyNames: Record<string, string> = { name: "Name", identity_type: "Account type", resource_type: "Resource type", machine_identity_id: "App or system account ID", resource_id: "Resource ID", credential_type: "Credential type", label: "Label", access_level: "Access level" };

export const csvTemplates: Record<ImportEntity, string> = {
  machine_identities: "name,identity_type,provider,external_id,environment,owner_name,owner_email,privilege_level,status,description",
  credentials: "machine_identity_id,credential_type,label,status,last_rotated_at,expires_at,fingerprint_reference",
  resources: "name,resource_type,provider,external_id,environment,sensitivity,description",
  access_relationships: "machine_identity_id,resource_id,access_level,privileged",
};
export const csvSamples: Record<ImportEntity, string> = {
  machine_identities: `${csvTemplates.machine_identities}\nbilling-worker,service_account,Azure,billing-worker-prod,production,Finance Platform,owner@example.com,high,active,Processes invoices`,
  credentials: `${csvTemplates.credentials}\n00000000-0000-4000-8000-000000000001,certificate,Billing certificate,active,2026-01-10,2027-01-10,sha256-reference-only`,
  resources: `${csvTemplates.resources}\nCustomer database,database,Azure,customer-db-prod,production,critical,Stores customer records`,
  access_relationships: `${csvTemplates.access_relationships}\n00000000-0000-4000-8000-000000000001,00000000-0000-4000-8000-000000000002,read,true`,
};

function normaliseHeader(header: string) { return header.trim().toLowerCase().replace(/[\s-]+/g, "_"); }
function isForbiddenHeader(header: string) { const value = normaliseHeader(header); return forbiddenTerms.some((term) => value === term || value.endsWith(`_${term}`)); }

export function parseCsv(text: string): CsvRow[] {
  if (new Blob([text]).size > 1_000_000) throw new Error("This file is larger than 1 MB. Split it into smaller files and try again.");
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]; const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && next === "\n") index += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += character;
  }
  if (quoted) throw new Error("The CSV has an unclosed quotation mark.");
  if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); }
  if (rows.length < 2) throw new Error("Add a header row and at least one data row.");
  const headers = rows[0].map(normaliseHeader);
  if (headers.some(isForbiddenHeader)) throw new Error("This file contains a secret-bearing column. Remove passwords, secrets, tokens, API keys, private keys, and client secrets.");
  if (headers.some((header) => !header)) throw new Error("One of the column headings is empty.");
  if (new Set(headers).size !== headers.length) throw new Error("Two or more columns have the same heading. Rename or remove the duplicate column.");
  return rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) throw new Error(`Row ${rowIndex + 2} has ${values.length} columns; the header has ${headers.length}.`);
    return { row: rowIndex + 2, values: Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) };
  });
}

function toInput(entity: ImportEntity, values: Record<string, string>) {
  if (entity === "machine_identities") return { name: values.name, identityType: values.identity_type, provider: values.provider || undefined, externalId: values.external_id || undefined, environment: values.environment || "unknown", ownerName: values.owner_name || undefined, ownerEmail: values.owner_email || undefined, privilegeLevel: values.privilege_level || "unknown", status: values.status || "unknown", description: values.description || undefined };
  if (entity === "resources") return { name: values.name, resourceType: values.resource_type, provider: values.provider || undefined, externalId: values.external_id || undefined, environment: values.environment || "unknown", sensitivity: values.sensitivity || "unknown", description: values.description || undefined };
  if (entity === "credentials") return { machineIdentityId: values.machine_identity_id, credentialType: values.credential_type, label: values.label, status: values.status || "unknown", lastRotatedAt: values.last_rotated_at || undefined, expiresAt: values.expires_at || undefined, fingerprintReference: values.fingerprint_reference || undefined };
  return { machineIdentityId: values.machine_identity_id, resourceId: values.resource_id, accessLevel: values.access_level, privileged: values.privileged?.toLowerCase() === "true" };
}

function issueMessage(issue: z.core.$ZodIssue) {
  const field = String(issue.path[0] ?? "value"); const label = friendlyNames[field] ?? field.replaceAll("_", " ");
  if (issue.code === "invalid_value") return `${label} has an unsupported value.`;
  if (issue.code === "invalid_format" && issue.format === "uuid") return `${label} must be a valid record ID.`;
  if (issue.code === "invalid_format" && issue.format === "email") return "Owner email must be a valid email address.";
  return `${label} is missing or invalid.`;
}

export function validateCsv(entity: ImportEntity, text: string): ValidatedCsvRow[] {
  const schema = entity === "machine_identities" ? machineIdentitySchema : entity === "resources" ? resourceSchema : entity === "credentials" ? credentialMetadataSchema : accessRelationshipSchema;
  return parseCsv(text).map((row) => {
    const result = schema.safeParse(toInput(entity, row.values));
    return result.success ? { ...row, valid: true, errors: [], parsed: result.data as Record<string, unknown> } : { ...row, valid: false, errors: result.error.issues.map(issueMessage) };
  });
}
