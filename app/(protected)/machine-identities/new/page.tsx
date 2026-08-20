import Link from "next/link";
import { MachineIdentityForm } from "@/components/security-forms";
import { requireSecurityContext } from "@/lib/security/context";
import { hasPermission } from "@/lib/security/permissions";

export default async function NewMachineIdentityPage() {
  const context = await requireSecurityContext("view_security_data");
  if (!hasPermission(context.role, "manage_security_inventory")) return <section><h2 className="text-3xl font-semibold text-[var(--navy)]">Register machine identity</h2><p className="mt-4 text-sm text-[var(--muted)]">Your Viewer role is read-only and cannot register machine identities.</p><Link className="focus-ring mt-5 inline-block text-sm font-semibold text-[var(--teal)]" href="/machine-identities">Return to inventory →</Link></section>;
  return <section><Link className="focus-ring text-sm font-semibold text-[var(--teal)]" href="/machine-identities">← Back to identity inventory</Link><div className="mt-6 border-b border-[var(--line)] pb-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--teal)]">Discover · Manual registration</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--navy)] sm:text-4xl">Register a machine identity</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">Add a service account, workload, application, API client, bot, automation identity or AI agent to {context.organisationName}. Record metadata only—never enter a password, key or token.</p></div><div className="panel mt-6 p-4 sm:p-6"><MachineIdentityForm /></div></section>;
}
