import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const machineIdentitySchema = z.object({
  name: z.string().trim().min(1).max(200), identityType: z.enum(["service_account", "application", "workload", "api_client", "bot", "automation", "cicd", "ai_agent", "other"]),
  provider: z.string().trim().max(200).optional(), externalId: z.string().trim().max(300).optional(), description: z.string().trim().max(2000).optional(),
  environment: z.enum(["production", "staging", "development", "test", "unknown"]), ownerName: z.string().trim().max(200).optional(), ownerEmail: z.string().trim().email().or(z.literal("")).optional(),
  privilegeLevel: z.enum(["low", "standard", "high", "critical", "unknown"]), status: z.enum(["active", "inactive", "suspended", "unknown"]),
});
export const credentialMetadataSchema = z.object({
  machineIdentityId: uuidSchema, credentialType: z.enum(["certificate", "api_key_metadata", "token_metadata", "ssh_key_metadata", "secret_metadata", "other"]),
  label: z.string().trim().min(1).max(200), status: z.enum(["active", "expired", "revoked", "unknown"]), lastRotatedAt: z.string().optional(), expiresAt: z.string().optional(), fingerprintReference: z.string().trim().max(300).optional(),
});
export const resourceSchema = z.object({
  name: z.string().trim().min(1).max(200), resourceType: z.enum(["database", "api", "storage", "cloud_resource", "repository", "application", "queue", "infrastructure", "other"]),
  provider: z.string().trim().max(200).optional(), externalId: z.string().trim().max(300).optional(), environment: z.enum(["production", "staging", "development", "test", "unknown"]), sensitivity: z.enum(["low", "medium", "high", "critical", "unknown"]), description: z.string().trim().max(2000).optional(),
});
export const accessRelationshipSchema = z.object({ machineIdentityId: uuidSchema, resourceId: uuidSchema, accessLevel: z.string().trim().min(1).max(120), privileged: z.boolean(), });

export function optionalText(value: FormDataEntryValue | null) { const text = typeof value === "string" ? value.trim() : ""; return text || undefined; }
export function requiredText(value: FormDataEntryValue | null) { return typeof value === "string" ? value : ""; }