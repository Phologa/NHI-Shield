import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessOrganisation, hasPermission, type Permission, type Role } from "@/lib/security/permissions";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/sign-in");
  return { supabase, user };
}

export async function requireOrganisationPermission(organisationId: string, permission: Permission) {
  const { supabase, user } = await requireUser();
  const { data: membership } = await supabase.from("memberships").select("organisation_id, role").eq("user_id", user.id).eq("organisation_id", organisationId).maybeSingle();
  const role = membership?.role as Role | undefined;
  if (!membership || !role || !canAccessOrganisation(membership.organisation_id, organisationId) || !hasPermission(role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return { supabase, user, membership, role };
}