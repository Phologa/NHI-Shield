import type { SecurityContext } from "@/lib/security/context";
import type { AiProvider } from "@/lib/security/ai-provider";
import { buildGrounding, getNavigationActions, sanitizeBundle, supabaseAiReadRepository, type AiDataBundle, type AiReadRepository } from "@/lib/security/ai-tools";
import type { AiResult } from "@/lib/security/ai-types";

const requests = new Map<string, number[]>();
export function checkAiRateLimit(key: string, now = Date.now(), maximum = 10, windowMs = 60_000) { const recent = (requests.get(key) ?? []).filter((time) => now - time < windowMs); if (recent.length >= maximum) return false; requests.set(key, [...recent, now]); return true; }
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
export function scopeBundleToQuestion(question: string, source: AiDataBundle): AiDataBundle {
  const ids = [...new Set(question.match(UUID) ?? [])]; if (!ids.length) return source;
  const wanted = new Set(ids.map((id) => id.toLowerCase())); const direct = (rows: Record<string, unknown>[]) => rows.filter((row) => wanted.has(String(row.id).toLowerCase()));
  const matched = [...direct(source.identities), ...direct(source.credentials), ...direct(source.resources), ...direct(source.findings), ...direct(source.incidents), ...direct(source.activity)];
  const related = new Set(matched.flatMap((row) => [row.id, row.machine_identity_id, row.resource_id, row.finding_id, row.incident_id].filter(Boolean).map(String)));
  const rows = (items: Record<string, unknown>[]) => items.filter((row) => [row.id, row.machine_identity_id, row.resource_id, row.finding_id, row.incident_id, row.activity_event_id].some((value) => value && related.has(String(value))));
  return sanitizeBundle({ identities: rows(source.identities), credentials: rows(source.credentials), resources: rows(source.resources), relationships: rows(source.relationships), findings: rows(source.findings), evidence: rows(source.evidence), incidents: rows(source.incidents), timeline: rows(source.timeline), activity: rows(source.activity), productKnowledge: [] });
}
export async function analyseSecurityQuestion(question: string, context: SecurityContext, provider: AiProvider, repository: AiReadRepository = supabaseAiReadRepository): Promise<AiResult> {
  const bundle = scopeBundleToQuestion(question, await repository.collect(context)); const grounding = buildGrounding(bundle);
  if (!Object.values(bundle).some((rows) => rows.length)) return { ok: true, configured: true, answer: { question, facts: [], deterministicAssessment: [], interpretation: "The requested record or evidence cannot be established from current NHI Shield data.", recommendations: ["Verify the identifier or import the relevant authorised inventory and activity data."], references: [], actions: getNavigationActions(context), limitations: ["No matching tenant-scoped records were returned."] } };
  const generated = await provider.generate({ question, organisationName: context.organisationName, groundedContext: bundle });
  return { ok: true, configured: true, answer: { question, ...grounding, interpretation: generated.interpretation, recommendations: generated.recommendations, actions: getNavigationActions(context), limitations: ["AI interpretation is advisory. Deterministic NHI Shield severity and risk values remain authoritative.", "No remediation or data mutation was performed."] } };
}
