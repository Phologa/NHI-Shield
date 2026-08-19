import { describe, expect, it } from "vitest";
import { csvSamples, parseCsv, validateCsv } from "@/lib/security/csv-import";

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
    expect(validateCsv("machine_identities", csvSamples.machine_identities).every((row) => row.valid)).toBe(true);
    expect(validateCsv("resources", csvSamples.resources).every((row) => row.valid)).toBe(true);
    expect(validateCsv("credentials", csvSamples.credentials).every((row) => row.valid)).toBe(true);
    expect(validateCsv("access_relationships", csvSamples.access_relationships).every((row) => row.valid)).toBe(true);
  });
});
