"use client";

import { useActionState } from "react";
import { createInvite, type OnboardingResult } from "@/lib/security/onboarding-actions";

const initialState: OnboardingResult = { ok: false };

export function InviteForm() {
  const [state, action, pending] = useActionState(createInvite, initialState);
  return <form action={action} className="mt-5 space-y-4 font-sans text-sm">
    <label className="block">Role<select className="mt-2 w-full border border-[var(--line)] bg-white px-3 py-3" name="role" defaultValue="viewer"><option value="viewer">Viewer</option><option value="security_analyst">Security Analyst</option></select></label>
    <label className="block">Invited email (optional)<input className="mt-2 w-full border border-[var(--line)] bg-white px-3 py-3" name="invitedEmail" type="email" /></label>
    <div className="grid grid-cols-2 gap-4"><label>Expires in days<input className="mt-2 w-full border border-[var(--line)] bg-white px-3 py-3" name="expiresInDays" type="number" defaultValue="7" min="1" max="30" /></label><label>Maximum uses<input className="mt-2 w-full border border-[var(--line)] bg-white px-3 py-3" name="maxUses" type="number" defaultValue="1" min="1" max="100" /></label></div>
    {state.error && <p className="text-red-700" role="alert">{state.error}</p>}
    {state.message && <p className="border-l-2 border-[var(--teal)] bg-white p-3 leading-6" role="status">{state.message}</p>}
    {state.inviteCode && <div className="border border-[var(--line)] bg-white p-4"><p className="font-semibold">Copy this code now</p><code className="mt-2 block select-all break-all font-mono text-sm">{state.inviteCode}</code>{state.joinUrl && <><p className="mt-4 font-semibold">Secure join link</p><a className="mt-2 block break-all text-[var(--teal)] underline" href={state.joinUrl}>{state.joinUrl}</a></>}</div>}
    <button className="focus-ring bg-[var(--navy)] px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={pending}>{pending ? "Creating invite..." : "Create invite"}</button>
  </form>;
}
