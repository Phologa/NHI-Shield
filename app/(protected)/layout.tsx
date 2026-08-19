import { requireUser } from "@/lib/security/authorization";
import { ProtectedShell } from "@/components/protected-shell";
import type { Role } from "@/lib/security/permissions";

type MembershipRow = { role: Role; organisations: { name: string } | null };

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) { const { supabase, user } = await requireUser(); const { data } = await supabase.from("memberships").select("role, organisations(name)").eq("user_id", user.id).limit(1).maybeSingle(); const row = data as MembershipRow | null; const membership = row?.organisations?.name ? { role: row.role, organisationName: row.organisations.name } : null; return <ProtectedShell email={user.email ?? "Authenticated user"} membership={membership}>{children}</ProtectedShell>; }