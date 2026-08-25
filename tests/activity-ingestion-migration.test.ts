import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/202608240001_activity_ingestion_detection_foundation.sql"), "utf8");

describe("activity ingestion database boundary", () => {
  it("enforces tenant management and tenant-consistent rows", () => {
    expect(migration).toContain("public.can_manage_security(target_org)");
    expect(migration).toContain("<> target_org");
  });
  it("uses source and request ID for idempotent persistence", () => {
    expect(migration).toContain("on conflict (organisation_id,source,request_id)");
    expect(migration).toContain("do nothing");
  });
  it("prevents duplicate activity links in an incident timeline", () => {
    expect(migration).toContain("incident_events_activity_detection_unique");
  });
  it("restricts execution to signed-in users", () => {
    expect(migration).toContain("from anon");
    expect(migration).toContain("to authenticated");
  });
});
