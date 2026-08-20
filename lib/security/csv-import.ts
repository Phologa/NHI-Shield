import { z } from "zod";
import { accessRelationshipSchema, credentialMetadataSchema, machineIdentitySchema, resourceSchema } from "@/lib/validation/security";

export const importEntitySchema = z.enum(["security_inventory", "machine_identities", "credentials", "resources", "access_relationships"]);
export type ImportEntity = z.infer<typeof importEntitySchema>;
export type CsvRow = { row: number; values: Record<string, string> };
export type ValidatedCsvRow = CsvRow & { valid: boolean; errors: string[]; parsed?: Record<string, unknown> };

const forbiddenTerms = ["password", "secret", "token", "api_key", "apikey", "private_key", "client_secret", "credential_value", "secret_value"];
const headerAliases: Record<string, string> = { account_name: "name", identity_name: "name", account_type: "identity_type", type: "identity_type", source: "provider", provider_id: "external_id", account_id: "external_id", owner: "owner_name", owner_mail: "owner_email", privilege: "privilege_level", last_active: "last_seen_at", target_name: "resource_name", target_type: "resource_type", target_id: "resource_external_id", target_sensitivity: "resource_sensitivity", permission: "access_level", is_privileged: "access_privileged", credential_name: "credential_label", credential_state: "credential_status" };
const friendlyNames: Record<string, string> = { name: "Name", identity_type: "Account type", resource_type: "Resource type", machine_identity_id: "App or system account ID", resource_id: "Resource ID", credential_type: "Credential type", label: "Label", access_level: "Access level" };
const inventorySchema = z.object({
  name: z.string().trim().min(1).max(200), identityType: machineIdentitySchema.shape.identityType, provider: z.string().trim().min(1).max(200), externalId: z.string().trim().min(1).max(300), environment: machineIdentitySchema.shape.environment,
  ownerName: z.string().trim().max(200).optional(), ownerEmail: z.string().trim().email().or(z.literal("")).optional(), privilegeLevel: machineIdentitySchema.shape.privilegeLevel, status: machineIdentitySchema.shape.status, description: z.string().trim().max(2000).optional(), lastSeenAt: z.string().optional(),
  resourceName: z.string().trim().max(200).optional(), resourceType: resourceSchema.shape.resourceType.optional(), resourceProvider: z.string().trim().max(200).optional(), resourceExternalId: z.string().trim().max(300).optional(), resourceEnvironment: resourceSchema.shape.environment.optional(), resourceSensitivity: resourceSchema.shape.sensitivity.optional(), resourceDescription: z.string().trim().max(2000).optional(), accessLevel: z.string().trim().max(120).optional(), accessPrivileged: z.boolean(),
  credentialType: credentialMetadataSchema.shape.credentialType.optional(), credentialLabel: z.string().trim().max(200).optional(), credentialStatus: credentialMetadataSchema.shape.status.optional(), credentialLastRotatedAt: z.string().optional(), credentialExpiresAt: z.string().optional(),
}).superRefine((value, context) => {
  const resourceFields = [value.resourceName, value.resourceType, value.resourceProvider, value.resourceExternalId, value.resourceEnvironment, value.resourceSensitivity, value.accessLevel];
  if (resourceFields.some(Boolean) && resourceFields.some((field) => !field)) context.addIssue({ code: "custom", message: "Complete every resource and access column when a row includes resource access." });
  const credentialFields = [value.credentialType, value.credentialLabel, value.credentialStatus];
  if (credentialFields.some(Boolean) && credentialFields.some((field) => !field)) context.addIssue({ code: "custom", message: "Credential type, label and status are all required when credential metadata is included." });
});

export const csvTemplates: Record<ImportEntity, string> = {
  security_inventory: "name,identity_type,provider,external_id,environment,owner_name,owner_email,privilege_level,status,last_seen_at,description,resource_name,resource_type,resource_provider,resource_external_id,resource_environment,resource_sensitivity,resource_description,access_level,access_privileged,credential_type,credential_label,credential_status,credential_last_rotated_at,credential_expires_at",
  machine_identities: "name,identity_type,provider,external_id,environment,owner_name,owner_email,privilege_level,status,description",
  credentials: "machine_identity_id,credential_type,label,status,last_rotated_at,expires_at,fingerprint_reference",
  resources: "name,resource_type,provider,external_id,environment,sensitivity,description",
  access_relationships: "machine_identity_id,resource_id,access_level,privileged",
};
export const csvSamples: Record<ImportEntity, string> = {
  security_inventory: `name,identity_type,provider,external_id,environment,owner_name,owner_email,privilege_level,status,last_seen_at,description,resource_name,resource_type,resource_provider,resource_external_id,resource_environment,resource_sensitivity,resource_description,access_level,access_privileged,credential_type,credential_label,credential_status,credential_last_rotated_at,credential_expires_at
Claims Copilot,ai_agent,Azure,ai-claims-prod,production,AI Platform,ai-owner@example.com,critical,active,2026-08-18T09:00:00Z,Reviews claims,Claims Database,database,Azure,claims-db-prod,production,critical,Sensitive claims data,"read,write,admin",true,token_metadata,Copilot broad-scope token,active,2024-01-10T00:00:00Z,2027-01-10T00:00:00Z
Legacy Billing Worker,service_account,Azure,billing-legacy,production,,,high,inactive,2024-02-01T00:00:00Z,Old billing integration,Billing API,api,Azure,billing-api-prod,production,high,Processes payments,write,true,api_key_metadata,Legacy API key,active,2022-03-01T00:00:00Z,2025-03-01T00:00:00Z
Orphaned Backup Bot,bot,AWS,backup-bot-prod,production,,,standard,active,2026-08-17T10:00:00Z,Backs up production data,Archive Storage,storage,AWS,archive-prod,production,high,Encrypted backups,write,false,ssh_key_metadata,Backup key,active,2026-06-01T00:00:00Z,2027-06-01T00:00:00Z
Dormant CRM Integration,application,Salesforce,crm-sync-old,production,Revenue Operations,revops@example.com,high,active,2024-06-01T00:00:00Z,Old CRM sync,Customer Records,application,Salesforce,customer-records,production,critical,Customer profiles,admin,true,token_metadata,CRM OAuth metadata,active,2024-05-01T00:00:00Z,2027-05-01T00:00:00Z
Claims Copilot,ai_agent,Azure,ai-claims-prod,production,Security Governance,security@example.com,critical,active,2026-08-18T09:00:00Z,Second observed owner assignment,Claims Archive,storage,Azure,claims-archive-prod,production,high,Claims retention archive,write,true,,,,,
Deployment Pipeline,cicd,GitHub,deploy-main,production,Platform Engineering,platform@example.com,high,active,2026-08-20T06:00:00Z,Production deployment automation,Production Cluster,infrastructure,AWS,eks-prod,production,critical,Main application cluster,deploy,true,certificate,Deployment certificate,active,2026-07-01T00:00:00Z,2027-07-01T00:00:00Z
Read-only Metrics,workload,GCP,metrics-reader,production,Observability,observability@example.com,low,active,2026-08-20T07:00:00Z,Reads service metrics,Metrics Warehouse,database,GCP,metrics-prod,production,medium,Operational metrics,read,false,certificate,Metrics certificate,active,2026-08-01T00:00:00Z,2027-08-01T00:00:00Z
Test Data Seeder,automation,Internal,test-seeder,test,Quality Engineering,qa@example.com,standard,active,2026-08-19T14:00:00Z,Seeds synthetic test data,Test Database,database,Internal,test-db,test,low,Synthetic data only,write,false,,,,,
Partner Webhook,api_client,Partner,partner-webhook,production,Integration Team,integrations@example.com,standard,active,2026-08-20T05:00:00Z,Receives partner events,Webhook API,api,Internal,webhook-prod,production,medium,Inbound integration API,invoke,false,api_key_metadata,Webhook key metadata,active,2026-08-01T00:00:00Z,2027-02-01T00:00:00Z`,
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
  if (entity === "security_inventory") return { name: values.name, identityType: values.identity_type, provider: values.provider, externalId: values.external_id, environment: values.environment || "unknown", ownerName: values.owner_name || undefined, ownerEmail: values.owner_email || undefined, privilegeLevel: values.privilege_level || "unknown", status: values.status || "unknown", lastSeenAt: values.last_seen_at || undefined, description: values.description || undefined, resourceName: values.resource_name || undefined, resourceType: values.resource_type || undefined, resourceProvider: values.resource_provider || undefined, resourceExternalId: values.resource_external_id || undefined, resourceEnvironment: values.resource_environment || undefined, resourceSensitivity: values.resource_sensitivity || undefined, resourceDescription: values.resource_description || undefined, accessLevel: values.access_level || undefined, accessPrivileged: values.access_privileged?.toLowerCase() === "true", credentialType: values.credential_type || undefined, credentialLabel: values.credential_label || undefined, credentialStatus: values.credential_status || undefined, credentialLastRotatedAt: values.credential_last_rotated_at || undefined, credentialExpiresAt: values.credential_expires_at || undefined };
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
  const schema = entity === "security_inventory" ? inventorySchema : entity === "machine_identities" ? machineIdentitySchema : entity === "resources" ? resourceSchema : entity === "credentials" ? credentialMetadataSchema : accessRelationshipSchema;
  return parseCsv(text).map((row) => {
    const mappedValues = Object.fromEntries(Object.entries(row.values).map(([header, value]) => [headerAliases[header] ?? header, value]));
    row = { ...row, values: mappedValues };
    const result = schema.safeParse(toInput(entity, row.values));
    return result.success ? { ...row, valid: true, errors: [], parsed: result.data as Record<string, unknown> } : { ...row, valid: false, errors: result.error.issues.map(issueMessage) };
  });
}

export function detectedColumnMappings(text: string) {
  const first = parseCsv(text)[0]?.values ?? {};
  return Object.keys(first).map((header) => ({ uploaded: header, mappedTo: headerAliases[header] ?? header, automatic: Boolean(headerAliases[header]) }));
}
