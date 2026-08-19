"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { acceptInvite, type OnboardingResult } from "@/lib/security/onboarding-actions";

const initialState: OnboardingResult = { ok: false };

function JoinContent() {
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();
  const [state, action, pending] = useActionState(acceptInvite, initialState);
  const returnPath = `/join?code=${encodeURIComponent(code)}`;
  return <main className="sans min-h-screen bg-[var(--navy)] p-6 text-white"><div className="mx-auto max-w-xl pt-16"><BrandMark light /><section className="mt-10 bg-white p-8 text-[var(--ink)]"><p className="text-sm font-semibold uppercase tracking-wider text-[var(--teal)]">Organisation invitation</p><h1 className="mt-3 font-serif text-3xl">Join your NHI Shield workspace</h1>{!code ? <p className="mt-5 text-sm text-red-700">This join link does not contain a valid invitation code.</p> : <><p className="mt-5 text-sm leading-6 text-[var(--muted)]">Sign in with the invited email address, then accept the invitation. The server verifies the email, expiry, usage limit and assigned role.</p><form action={action} className="mt-6"><input name="inviteCode" type="hidden" value={code} />{state.error && <p className="mb-4 text-sm text-red-700" role="alert">{state.error}</p>}{state.message && <p className="mb-4 border-l-2 border-[var(--teal)] bg-[var(--teal-soft)] p-3 text-sm" role="status">{state.message}</p>}<button className="focus-ring bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={pending}>{pending ? "Accepting..." : "Accept invitation"}</button></form><div className="mt-6 flex gap-5 text-sm"><Link className="text-[var(--teal)] underline" href={`/sign-in?next=${encodeURIComponent(returnPath)}`}>Sign in first</Link><Link className="text-[var(--teal)] underline" href={`/sign-up?next=${encodeURIComponent(returnPath)}`}>Create an account</Link></div></>}</section></div></main>;
}

export default function JoinPage() { return <Suspense><JoinContent /></Suspense>; }
