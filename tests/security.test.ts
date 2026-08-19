import { describe, expect, it } from "vitest";
import { canAccessOrganisation, hasPermission } from "@/lib/security/permissions";

describe("RBAC and tenant isolation", () => {
  it("grants only role-appropriate permissions", () => {
    expect(hasPermission("viewer", "view_security_data")).toBe(true);
    expect(hasPermission("viewer", "execute_remediation")).toBe(false);
    expect(hasPermission("security_analyst", "investigate_incident")).toBe(true);
  });
  it("rejects Organisation B for a user whose membership is in Organisation A", () => {
    expect(canAccessOrganisation("org-a", "org-b")).toBe(false);
    expect(canAccessOrganisation("org-a", "org-a")).toBe(true);
  });
});

describe("environment validation", () => {
  it("rejects missing or malformed public configuration", async () => {
    const { getPublicEnv } = await import("@/lib/env");
    expect(() => getPublicEnv({})).toThrow();
    expect(() => getPublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "bad", NEXT_PUBLIC_SUPABASE_ANON_KEY: "x" })).toThrow();
  });
});