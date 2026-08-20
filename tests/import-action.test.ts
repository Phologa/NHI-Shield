import { beforeEach, describe, expect, it, vi } from "vitest";
import { csvSamples } from "@/lib/security/csv-import";

const rpc = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
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
});
