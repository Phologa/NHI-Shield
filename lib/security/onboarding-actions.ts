"use server";

import { createHash, randomBytes } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getServerEnv } from "@/lib/env";
import { requireUser } from "@/lib/security/authorization";
import { requireSecurityContext } from "@/lib/security/context";
import { z } from "zod";

export type OnboardingResult = { ok: boolean; message?: string; error?: string; inviteCode?: string; joinUrl?: string };
const organisationSchema = z.object({ name: z.string().trim().min(2).max(200) });
const inviteSchema = z.object({ role: z.enum(["viewer", "security_analyst"]), invitedEmail: z.string().trim().toLowerCase().email().or(z.literal("")), expiresInDays: z.coerce.number().int().min(1).max(30), maxUses: z.coerce.number().int().min(1).max(100) });
const hashInvite = (code: string) => createHash("sha256").update(code).digest("hex");
const actionError = (error: unknown): OnboardingResult => {
  const message = error instanceof Error ? error.message : "";
  if (message === "FORBIDDEN") return { ok: false, error: "You are not authorised to perform this action." };
  if (message === "INVALID_INVITE") return { ok: false, error: "This invitation is invalid, expired, already used, revoked, or restricted to another email address." };
  return { ok: false, error: "The request could not be completed. Nothing was changed; try again or contact an organisation administrator." };
};

export async function createOrganisation(_previous: OnboardingResult, formData: FormData): Promise<OnboardingResult> { try { const { supabase } = await requireUser(); const parsed = organisationSchema.parse({ name: formData.get("name") }); const { data, error } = await supabase.rpc("create_organisation_with_membership", { org_name: parsed.name, org_slug: null }); if (error || !data) throw new Error("CREATE_FAILED"); revalidatePath("/overview"); return { ok: true, message: "Workspace created. You are now an organisation administrator." }; } catch (error) { return actionError(error); } }

export async function acceptInvite(_previous: OnboardingResult, formData: FormData): Promise<OnboardingResult> { try { const { supabase } = await requireUser(); const code = String(formData.get("inviteCode") ?? "").trim().toUpperCase(); if (!/^[A-Z0-9-]{12,64}$/.test(code)) throw new Error("INVALID_CODE"); const { error } = await supabase.rpc("accept_organisation_invite", { invite_hash: hashInvite(code) }); if (error) throw new Error("INVALID_INVITE"); revalidatePath("/overview"); return { ok: true, message: "Invite accepted. Your workspace is ready." }; } catch (error) { return actionError(error); } }

export async function createInvite(_previous: OnboardingResult, formData: FormData): Promise<OnboardingResult> { try { const context = await requireSecurityContext("manage_organisation"); const parsed = inviteSchema.parse({ role: formData.get("role"), invitedEmail: formData.get("invitedEmail") ?? "", expiresInDays: formData.get("expiresInDays") ?? 7, maxUses: formData.get("maxUses") ?? 1 }); const code = randomBytes(18).toString("base64url").toUpperCase(); const env = getServerEnv(); const joinUrl = env.APP_URL ? new URL(`/join?code=${encodeURIComponent(code)}`, env.APP_URL).toString() : undefined; const { error } = await context.supabase.rpc("create_organisation_invite", { target_org: context.organisationId, invite_hash: hashInvite(code), intended_role: parsed.role, invited_address: parsed.invitedEmail || null, expiry: new Date(Date.now() + parsed.expiresInDays * 86400000).toISOString(), allowed_uses: parsed.maxUses }); if (error) throw new Error("CREATE_FAILED"); let emailSent = false; if (parsed.invitedEmail && joinUrl && env.SUPABASE_SERVICE_ROLE_KEY) { const admin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } }); const { error: emailError } = await admin.auth.admin.inviteUserByEmail(parsed.invitedEmail, { redirectTo: joinUrl, data: { organisation_name: context.organisationName, organisation_role: parsed.role } }); emailSent = !emailError; } if (emailSent) await context.supabase.from("audit_events").insert({ organisation_id: context.organisationId, actor_user_id: context.userId, action: "invite_email_sent", entity_type: "organisation_invite", metadata: { invited_email: parsed.invitedEmail } }); revalidatePath("/settings"); const message = emailSent ? `Invitation email sent to ${parsed.invitedEmail}. The code is also shown once below.` : parsed.invitedEmail ? "Invite created, but email was not sent. Copy the code below now. Email delivery requires APP_URL, the server-only Supabase service-role key, and working Supabase Auth email/SMTP configuration." : "Invite created. Copy the code now; it will not be shown again."; return { ok: true, message, inviteCode: code, joinUrl }; } catch (error) { return actionError(error); } }

export async function revokeInvite(formData: FormData): Promise<void> { const context = await requireSecurityContext("manage_organisation"); const inviteId = z.string().uuid().parse(formData.get("inviteId")); const { error } = await context.supabase.rpc("revoke_organisation_invite", { target_org: context.organisationId, invite_id: inviteId }); if (error) throw new Error("REVOKE_FAILED"); revalidatePath("/settings"); }

export async function updateMemberRole(formData: FormData): Promise<void> { const context = await requireSecurityContext("manage_organisation"); const userId = z.string().uuid().parse(formData.get("userId")); const role = z.enum(["viewer", "security_analyst", "organisation_admin"]).parse(formData.get("role")); const { error } = await context.supabase.rpc("set_organisation_member_role", { target_org: context.organisationId, target_user: userId, intended_role: role }); if (error) throw new Error("ROLE_UPDATE_FAILED"); revalidatePath("/settings"); }

export async function removeMember(formData: FormData): Promise<void> { const context = await requireSecurityContext("manage_organisation"); const userId = z.string().uuid().parse(formData.get("userId")); const { error } = await context.supabase.rpc("remove_organisation_member", { target_org: context.organisationId, target_user: userId }); if (error) throw new Error("MEMBER_REMOVE_FAILED"); revalidatePath("/settings"); }

