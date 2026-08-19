import { describe, expect, it } from "vitest";
import { canAccessOrganisation, hasPermission } from "@/lib/security/permissions";
import { canLinkOrganisationRecords } from "@/lib/security/repositories";
import { evaluateIdentityRisk } from "@/lib/security/risk";
import { credentialMetadataSchema, machineIdentitySchema } from "@/lib/validation/security";

describe("RBAC and tenant isolation", () => {
  it("grants only role-appropriate permissions", () => {
    expect(hasPermission("viewer", "view_security_data")).toBe(true);
    expect(hasPermission("viewer", "execute_remediation")).toBe(false);
    expect(hasPermission("security_analyst", "investigate_incident")).toBe(true);
  });
  it("rejects Organisation B for a user whose membership is in Organisation A", () => {
    expect(canAccessOrganisation("org-a", "org-b")).toBe(false);
    expect(canAccessOrganisation("org-a", "org-a")).toBe(true);
    expect(canLinkOrganisationRecords("org-a", "org-b")).toBe(false);
  });
  it("supports inventory management for analysts without granting remediation execution", () => {
    expect(hasPermission("security_analyst", "manage_security_inventory")).toBe(true);
    expect(hasPermission("security_analyst", "execute_remediation")).toBe(false);
  });
});

describe("deterministic risk rules", () => {
  const identity = { id: "identity-a", name: "billing-worker", owner_name: null, privilege_level: "high", last_seen_at: "2020-01-01T00:00:00.000Z" };
  it("produces reproducible findings with bounded scores and confidence", () => {
    const findings = evaluateIdentityRisk(identity, [{ id: "credential-a", label: "worker certificate", status: "expired", expires_at: "2020-01-01T00:00:00.000Z", machine_identity_id: identity.id }], [], [], new Date("2026-01-01T00:00:00.000Z"));
    expect(findings.map((finding) => finding.findingType)).toEqual(["missing_owner", "high_privilege_identity", "stale_identity", "expired_credential"]);
    expect(findings.every((finding) => finding.riskScore >= 0 && finding.riskScore <= 100 && finding.confidence >= 0 && finding.confidence <= 100)).toBe(true);
    expect(evaluateIdentityRisk(identity, [], [], [], new Date("2026-01-01T00:00:00.000Z"))).toEqual(findings.filter((finding) => finding.findingType !== "expired_credential"));
  });
  it("uses stable rule identifiers for idempotent upserts", () => {
    const findings = evaluateIdentityRisk(identity, [], [], []);
    expect(new Set(findings.map((finding) => `${finding.findingType}:${finding.machineIdentityId}:${finding.resourceId ?? ""}`)).size).toBe(findings.length);
  });
});

describe("security validation", () => {
  it("rejects secret-value fields from credential metadata", () => {
    expect(() => credentialMetadataSchema.parse({ machineIdentityId: "not-a-uuid", credentialType: "api_key_metadata", label: "key", status: "active", value: "secret" })).toThrow();
    expect(Object.keys(credentialMetadataSchema.shape)).not.toContain("value");
  });
  it("validates required machine identity fields", () => {
    expect(() => machineIdentitySchema.parse({ name: "", identityType: "service_account", environment: "production", privilegeLevel: "low", status: "active" })).toThrow();
  });
});

describe("environment validation", () => {
  it("rejects missing or malformed public configuration", async () => {
    const { getPublicEnv } = await import("@/lib/env");
    expect(() => getPublicEnv({})).toThrow();
    expect(() => getPublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "bad", NEXT_PUBLIC_SUPABASE_ANON_KEY: "x" })).toThrow();
  });
});