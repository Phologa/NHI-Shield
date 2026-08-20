import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resetPasswordSchema, signUpSchema } from "@/lib/validation/auth";
import { onboardingErrorMessage } from "@/lib/security/onboarding-errors";

describe("account onboarding", () => {
  it("creates an account without forcing a new organisation during an invite journey", () => {
    expect(signUpSchema.safeParse({ fullName: "Alex Admin", email: "alex@example.test", password: "safe-pass-123", confirmPassword: "safe-pass-123" }).success).toBe(true);
  });

  it("requires matching recovery passwords", () => {
    expect(resetPasswordSchema.safeParse({ password: "safe-pass-123", confirmPassword: "different-pass" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "safe-pass-123", confirmPassword: "safe-pass-123" }).success).toBe(true);
  });
});

describe("onboarding error handling", () => {
  it("explains when the account already has a membership", () => {
    expect(onboardingErrorMessage({ code: "P0001", message: "invalid_onboarding_state" })).toContain("already belongs to an organisation");
  });

  it("reports missing RPCs and permission failures without exposing database details", () => {
    expect(onboardingErrorMessage({ code: "PGRST202", message: "internal details" })).toContain("database is not ready");
    expect(onboardingErrorMessage({ code: "42501", message: "internal details" })).toContain("not available for this account");
    expect(onboardingErrorMessage({ code: "XX000", message: "sensitive internal details" })).not.toContain("sensitive");
  });
});

describe("database-enforced membership boundary", () => {
  const migration = readFileSync(join(process.cwd(), "supabase/migrations/202608200007_foundation_membership_hardening.sql"), "utf8");

  it("removes direct membership and invitation mutation policies", () => {
    expect(migration).toContain('drop policy if exists "admins manage memberships"');
    expect(migration).toContain('drop policy if exists "admins create invites"');
    expect(migration).toContain('drop policy if exists "admins update invites"');
  });

  it("forbids customer promotion to platform administrator and self role changes", () => {
    expect(migration).toContain("if intended_role = 'platform_admin'");
    expect(migration).toContain("self_role_change_forbidden");
    expect(migration).toContain("self_removal_forbidden");
  });

  it("audits organisation creation, invite acceptance and membership mutations", () => {
    for (const action of ["organisation_created", "invite_accepted", "invite_created", "invite_revoked", "member_role_changed", "member_removed"]) expect(migration).toContain(`'${action}'`);
  });
});

describe("onboarding RPC execution boundary", () => {
  const migration = readFileSync(join(process.cwd(), "supabase/migrations/202608200011_restrict_onboarding_rpc_execution.sql"), "utf8");

  it("allows onboarding RPC execution only for authenticated users", () => {
    expect(migration).toContain("from public");
    expect(migration).toContain("from anon");
    expect(migration).toContain("to authenticated");
  });
});
