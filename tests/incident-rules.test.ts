import { describe, expect, it } from "vitest";
import { detectionKey, incidentRuleFor, type DetectionEvent } from "@/lib/security/incident-rules";

const now = new Date("2026-08-24T12:00:00.000Z");
const event = (overrides: Partial<DetectionEvent> = {}): DetectionEvent => ({ id: "event-1", machine_identity_id: "identity-1", resource_id: "resource-1", outcome: "allowed", occurred_at: "2026-08-24T11:55:00.000Z", source: "entra", resources: { sensitivity: "high" }, ...overrides });

describe("deterministic incident rules", () => {
  it("detects access without a mapped relationship", () => { expect(incidentRuleFor(event(), [event()], false, false, now)?.key).toBe("unmapped_access"); });
  it("detects three denied attempts for the same identity and resource within 15 minutes", () => { const events = ["11:40", "11:47", "11:55"].map((time, index) => event({ id: `event-${index}`, outcome: "denied", occurred_at: `2026-08-24T${time}:00.000Z` })); expect(incidentRuleFor(events[2], events, true, false, now)?.key).toBe("repeated_denied_access"); });
  it("uses the privileged access relationship for critical-resource detection", () => { const critical = event({ resources: { sensitivity: "critical" }, machine_identities: { privilege_level: "low" } }); expect(incidentRuleFor(critical, [critical], true, true, now)?.key).toBe("privileged_critical_resource"); expect(incidentRuleFor(critical, [critical], true, false, now)).toBeNull(); });
  it("ignores stale, invalid, and materially future timestamps", () => { expect(incidentRuleFor(event({ occurred_at: "2026-08-23T11:00:00.000Z" }), [], false, false, now)).toBeNull(); expect(incidentRuleFor(event({ occurred_at: "not-a-date" }), [], false, false, now)).toBeNull(); expect(incidentRuleFor(event({ occurred_at: "2026-08-24T12:06:00.000Z" }), [], false, false, now)).toBeNull(); });
  it("builds stable incident grouping keys", () => { expect(detectionKey("unmapped_access", event())).toBe("unmapped_access:identity-1:resource-1"); });
});
