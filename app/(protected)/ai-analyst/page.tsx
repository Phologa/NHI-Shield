import { AiAnalyst } from "@/components/ai-analyst";
import { requireSecurityContext } from "@/lib/security/context";
export default async function AiAnalystPage() { await requireSecurityContext("view_security_data"); return <section><h2 className="text-3xl font-semibold tracking-tight text-[var(--navy)] sm:text-4xl">AI Security Analyst</h2><p className="mt-3 text-sm text-[var(--muted)]">Analyse current identity and access risk.</p><div className="mt-6"><AiAnalyst /></div></section>; }
