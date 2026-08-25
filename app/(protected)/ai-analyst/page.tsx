import { AiAnalystConsole } from "@/components/ai-analyst-console";
import { requireSecurityContext } from "@/lib/security/context";

export default async function AiSecurityAnalystPage() {
  await requireSecurityContext("view_security_data");
  return <div className="space-y-6"><header><p className="eyebrow">Read-only investigation</p><h1 className="mt-2 text-3xl font-semibold text-[var(--navy)]">AI Security Analyst</h1><p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Tenant-scoped analysis grounded in persisted NHI Shield records and deterministic security results.</p></header><AiAnalystConsole /></div>;
}
