import { describe, expect, it } from "vitest";
import { csvSamples, detectedColumnMappings, parseCsv, validateCsv } from "@/lib/security/csv-import";

describe("CSV import safety and preview", () => {
  it("parses quoted commas and produces a valid plain-English preview", () => {
    const rows = validateCsv("machine_identities", "name,identity_type,environment,privilege_level,status\n\"Billing, worker\",service_account,production,high,active");
    expect(rows).toHaveLength(1); expect(rows[0].valid).toBe(true); expect(rows[0].values.name).toBe("Billing, worker");
  });
  it.each(["password", "secret", "token", "api_key", "private_key", "client_secret"])("rejects the secret-bearing %s column", (header) => {
    expect(() => parseCsv(`name,identity_type,environment,privilege_level,status,${header}\nworker,service_account,production,high,active,do-not-store`)).toThrow(/secret-bearing/);
  });
  it("rejects duplicate headers and inconsistent row widths", () => {
    expect(() => parseCsv("name,name\na,b")).toThrow(/same heading/);
    expect(() => parseCsv("name,identity_type\nworker")).toThrow(/header has 2/);
  });
  it("returns actionable row-level validation errors", () => {
    const [row] = validateCsv("resources", "name,resource_type,environment,sensitivity\n,wrong,moon,huge");
    expect(row.valid).toBe(false); expect(row.errors.join(" ")).toMatch(/Name|unsupported/);
  });
  it("keeps all four downloadable examples valid", () => {
    expect(validateCsv("security_inventory", csvSamples.security_inventory).every((row) => row.valid)).toBe(true);
    expect(validateCsv("machine_identities", csvSamples.machine_identities).every((row) => row.valid)).toBe(true);
    expect(validateCsv("resources", csvSamples.resources).every((row) => row.valid)).toBe(true);
    expect(validateCsv("credentials", csvSamples.credentials).every((row) => row.valid)).toBe(true);
    expect(validateCsv("access_relationships", csvSamples.access_relationships).every((row) => row.valid)).toBe(true);
  });
  it("ships a realistic one-file demo with healthy and risky comparison records", () => {
    const rows = validateCsv("security_inventory", csvSamples.security_inventory);
    expect(rows.length).toBeGreaterThanOrEqual(8);
    expect(rows.some((row) => row.parsed?.identityType === "ai_agent" && row.parsed?.privilegeLevel === "critical")).toBe(true);
    expect(rows.some((row) => !row.parsed?.ownerName)).toBe(true);
    expect(rows.some((row) => row.parsed?.status === "inactive" && Boolean(row.parsed?.accessLevel))).toBe(true);
    expect(rows.some((row) => row.parsed?.privilegeLevel === "low" && row.parsed?.accessPrivileged === false)).toBe(true);
    expect(rows.filter((row) => row.parsed?.externalId === "ai-claims-prod").map((row) => row.parsed?.ownerName)).toEqual(["AI Platform", "Security Governance"]);
  });
  it("auto-maps common human-friendly headings", () => {
    const csv = "account_name,account_type,source,provider_id,environment,privilege,status\nWorker,service_account,Azure,worker-1,production,standard,active";
    expect(validateCsv("machine_identities", csv)[0].valid).toBe(true);
    expect(detectedColumnMappings(csv)).toContainEqual({ uploaded: "account_name", mappedTo: "name", automatic: true });
  });
  it("flags repeated stable identity references without making valid rows unimportable", () => {
    const csv = "name,identity_type,provider,external_id,environment,privilege_level,status\nWorker,service_account,Azure,worker-1,production,standard,active\nWorker updated,service_account,Azure,worker-1,production,high,active";
    const rows = validateCsv("machine_identities", csv);
    expect(rows.every((row) => row.valid)).toBe(true);
    expect(rows[0].warnings).toEqual([]);
    expect(rows[1].warnings.join(" ")).toMatch(/Duplicate of row 2/);
  });
  it("validates idempotent activity events and rejects missing request IDs", () => {
    const rows = validateCsv("activity_events", csvSamples.activity_events);
    expect(rows).toHaveLength(1);
    expect(rows[0].valid).toBe(true);
    const invalid = validateCsv("activity_events", "machine_identity_id,action,outcome,occurred_at,source,request_id\n00000000-0000-4000-8000-000000000001,read,allowed,2026-08-24T08:00:00Z,entra,");
    expect(invalid[0].valid).toBe(false);
  });
});
