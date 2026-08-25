import { ActivityForm, DetectionButton } from "@/components/incident-forms";
import { requireSecurityContext } from "@/lib/security/context";
import { listMachineIdentities, listResources } from "@/lib/security/repositories";
import { hasPermission } from "@/lib/security/permissions";

type RelatedName = { name: string } | Array<{ name: string }> | null;
type IncidentRow = { id: string; title: string; severity: string; status: string; last_activity_at: string; machine_identities: RelatedName; resources: RelatedName };
type ActivityRow = { id: string; action: string; outcome: string; occurred_at: string; machine_identities: RelatedName; resources: RelatedName };
function relatedName(value: RelatedName, fallback: string) { return (Array.isArray(value) ? value[0]?.name : value?.name) ?? fallback; }

export default async function IncidentsPage() {
  const context = await requireSecurityContext("view_security_data");
  const [{ data: rawIncidents }, { data: rawEvents }, identities, resources] = await Promise.all([
    context.supabase.from("incidents").select("*, machine_identities(name), resources(name)").eq("organisation_id", context.organisationId).order("last_activity_at", { ascending: false }),
    context.supabase.from("activity_events").select("id, action, outcome, occurred_at, machine_identities(name), resources(name)").eq("organisation_id", context.organisationId).order("occurred_at", { ascending: false }).limit(20),
    listMachineIdentities(context), listResources(context),
  ]);
  const incidents = (rawIncidents ?? []) as unknown as IncidentRow[];
  const events = (rawEvents ?? []) as unknown as ActivityRow[];
  const identityOptions = identities.map((item) => ({ id: item.id, name: item.name }));
  const resourceOptions = resources.map((item) => ({ id: item.id, name: item.name }));
  const canInvestigate = hasPermission(context.role, "investigate_incident");
  return <section>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="font-sans text-sm font-semibold uppercase tracking-wider text-[var(--teal)]">Monitoring and detection</p><h2 className="mt-3 font-serif text-4xl">Incidents</h2><p className="font-sans mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Persisted activity and deterministic incident detection. No AI analysis or remediation is active.</p></div>{canInvestigate && <DetectionButton />}</div>
    {!incidents.length ? <div className="mt-8 border border-[var(--line)] bg-white p-8"><h3 className="font-serif text-xl">No incidents recorded</h3><p className="font-sans mt-3 text-sm leading-6 text-[var(--muted)]">Ingest verified activity, then run detection. NHI Shield does not fabricate incidents.</p></div> : <div className="mt-8 space-y-3">{incidents.map((incident) => <a className="focus-ring block border border-[var(--line)] bg-white p-5 font-sans transition-colors hover:border-[var(--teal)]" href={`/incidents/${incident.id}`} key={incident.id}><div className="flex flex-wrap justify-between gap-3"><strong>{incident.title}</strong><span className="uppercase tracking-wider">{incident.severity} · {incident.status}</span></div><p className="mt-2 text-sm text-[var(--muted)]">{relatedName(incident.machine_identities, "Identity not recorded")} → {relatedName(incident.resources, "Resource not recorded")}</p><p className="mt-2 text-xs text-[var(--muted)]">Last activity {new Date(incident.last_activity_at).toLocaleString()}</p></a>)}</div>}
    {canInvestigate && <details className="mt-10 border border-[var(--line)] bg-[#eef4f7] p-6"><summary className="cursor-pointer font-serif text-xl">Record manual test activity</summary>{!identityOptions.length ? <p className="font-sans mt-4 text-sm text-[var(--muted)]">Register a machine identity before recording activity.</p> : <div className="mt-6"><ActivityForm identities={identityOptions} resources={resourceOptions} /></div>}</details>}
    <div className="mt-10"><h3 className="font-serif text-2xl">Recent activity</h3>{!events.length ? <p className="font-sans mt-4 border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">No activity events recorded.</p> : <div className="mt-4 space-y-2">{events.map((event) => <div className="border border-[var(--line)] bg-white p-4 font-sans text-sm" key={event.id}><strong>{event.action}</strong><span className="ml-3 text-[var(--muted)]">{event.outcome}</span><p className="mt-1 text-xs text-[var(--muted)]">{relatedName(event.machine_identities, "Identity")} · {relatedName(event.resources, "No resource")} · {new Date(event.occurred_at).toLocaleString()}</p></div>)}</div>}</div>
  </section>;
}
