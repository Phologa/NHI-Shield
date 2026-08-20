import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/security/authorization";
import { hasPermission, type Permission, type Role } from "@/lib/security/permissions";
import { redirect } from "next/navigation";

export type SecurityContext = { supabase: Awaited<ReturnType<typeof createClient>>; userId: string; organisationId: string; organisationName: string; role: Role };

export async function requireSecurityContext(permission?: Permission): Promise<SecurityContext> {
  const { supabase, user } = await requireUser();
  const { data: membership, error: membershipError } = await supabase.from("memberships").select("organisation_id, role").eq("user_id", user.id).limit(1).maybeSingle();
  if (membershipError) throw new Error("ACCESS_SETUP_REQUIRED");
  if (!membership) redirect("/onboarding");
  const role = membership.role as Role;
  if (permission && !hasPermission(role, permission)) throw new Error("FORBIDDEN");
  const { data: organisation, error: organisationError } = await supabase.from("organisations").select("name").eq("id", membership.organisation_id).single();
  if (organisationError || !organisation) throw new Error("ACCESS_SETUP_REQUIRED");
  return { supabase, userId: user.id, organisationId: membership.organisation_id, organisationName: organisation.name, role };
}
