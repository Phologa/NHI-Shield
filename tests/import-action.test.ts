import { beforeEach, describe, expect, it, vi } from "vitest";
import { csvSamples } from "@/lib/security/csv-import";

const rpc = vi.fn();
const revalidatePath = vi.fn();
const runIncidentDetection = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/security/incident-actions", () => ({ runIncidentDetection }));
vi.mock("@/lib/security/context", () => ({
  requireSecurityContext: vi.fn(async () => ({
    organisationId: "11111111-1111-4111-8111-111111111111",
    userId: "22222222-2222-4222-8222-222222222222",
    role: "organisation_admin",
    supabase: { rpc },
  })),
}));

describe("confirmed CSV persistence action", () => {
  beforeEach(() => {
    rpc.mockReset();
    revalidatePath.mockReset();
    runIncidentDetection.mockReset();
  });

  it("does not call the database before explicit confirmation", async () => {
    const { importCsv } = await import("@/lib/security/import-actions");
    const form = new FormData();
    form.set("entity", "security_inventory");
    form.set("csv", csvSamples.security_inventory);
    form.set("confirmed", "no");

    const result = await importCsv({ ok: true }, form);

    expect(result.ok).toBe(false);
    expect(result.errors?.[0]).toMatch(/confirm/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sends validated tenant-scoped rows to the atomic inventory RPC and refreshes analysis views", async () => {
    rpc.mockResolvedValue({ data: { processed: 9, relationships: 8, credentials: 7 }, error: null });
    const { importCsv } = await import("@/lib/security/import-actions");
    const form = new FormData();
    form.set("entity", "security_inventory");
    form.set("csv", csvSamples.security_inventory);
    form.set("confirmed", "yes");

    const result = await importCsv({ ok: true }, form);

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Import complete/);
    expect(rpc).toHaveBeenCalledOnce();
    const [functionName, parameters] = rpc.mock.calls[0];
    expect(functionName).toBe("import_security_inventory_csv");
    expect(parameters.import_rows).toHaveLength(9);
    expect(parameters.import_rows.every((row: { organisation_id: string }) => row.organisation_id === "11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/overview");
    expect(revalidatePath).toHaveBeenCalledWith("/machine-identities");
    expect(revalidatePath).toHaveBeenCalledWith("/access-graph");
    expect(revalidatePath).toHaveBeenCalledWith("/data-sources");
  });

  it("reports an atomic failure when the database rejects the import", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "database rejection" } });
    const { importCsv } = await import("@/lib/security/import-actions");
    const form = new FormData();
    form.set("entity", "security_inventory");
    form.set("csv", csvSamples.security_inventory);
    form.set("confirmed", "yes");

    const result = await importCsv({ ok: true }, form);

    expect(result.ok).toBe(false);
    expect(result.errors?.[0]).toMatch(/Nothing was imported/);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("persists activity by stable request ID and runs deterministic detection", async () => {
    rpc.mockResolvedValue({ data: { processed: 1 }, error: null });
    runIncidentDetection.mockResolvedValue(1);
    const { importCsv } = await import("@/lib/security/import-actions");
    const form = new FormData();
    form.set("entity", "activity_events");
    form.set("csv", csvSamples.activity_events);
    form.set("confirmed", "yes");
    const result = await importCsv({ ok: true }, form);
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/1 incident/);
    expect(rpc).toHaveBeenCalledWith("import_activity_events_csv", expect.objectContaining({ import_rows: expect.any(Array) }));
    expect(runIncidentDetection).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenCalledWith("/incidents");
  });

  it("reports persisted activity accurately when follow-up detection fails", async () => {
    rpc.mockResolvedValue({ data: { processed: 1 }, error: null });
    runIncidentDetection.mockRejectedValue(new Error("detection unavailable"));
    const { importCsv } = await import("@/lib/security/import-actions");
    const form = new FormData();
    form.set("entity", "activity_events");
    form.set("csv", csvSamples.activity_events);
    form.set("confirmed", "yes");
    const result = await importCsv({ ok: true }, form);
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/events persisted/i);
    expect(result.message).toMatch(/run incident detection/i);
  });
});
