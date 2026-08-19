"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import type { Role } from "@/lib/security/permissions";

type MembershipContext = { role: Role; organisationName: string } | null;
type ProtectedShellProps = { children: React.ReactNode; email: string; membership: MembershipContext };

const navigation = [
  { label: "Overview", href: "/overview" }, { label: "Add company data", href: "/import" },
  { label: "Data sources", href: "/data-sources" }, { label: "Apps & system accounts", href: "/machine-identities" },
  { label: "Who can access what", href: "/access-graph" }, { label: "Risks", href: "/findings" },
  { label: "Incidents", href: "/incidents" }, { label: "Ask NHI Shield AI", href: "/ai-analyst" },
  { label: "Recommended actions", href: "/remediation" }, { label: "Reports", href: "/reports" },
  { label: "Audit history", href: "/audit-log" }, { label: "Settings", href: "/settings" },
];
const roleLabels: Record<Role, string> = { platform_admin: "Platform Admin", organisation_admin: "Organisation Admin", security_analyst: "Security Analyst", viewer: "Viewer" };

function NavigationLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return <nav aria-label="Primary navigation" className="space-y-1">{navigation.map((item) => <Link className={`focus-ring flex items-center border-l-2 px-3 py-3 text-sm transition-colors ${pathname === item.href ? "border-[var(--cyan)] bg-[#1d4662] text-white" : "border-transparent text-slate-300 hover:bg-[#193d58] hover:text-white"}`} href={item.href} key={item.href} onClick={onNavigate}>{item.label}</Link>)}</nav>;
}

function UserContext({ email, membership }: { email: string; membership: MembershipContext }) {
  return <div className="border-t border-[#29455b] p-5"><p className="truncate text-xs text-slate-300">{email}</p>{membership && <p className="mt-1 text-xs text-slate-400">{roleLabels[membership.role]}</p>}<form action="/auth/signout" method="post"><button className="focus-ring mt-4 text-xs font-semibold text-[var(--cyan)] hover:text-white">Sign out</button></form></div>;
}

export function ProtectedShell({ children, email, membership }: ProtectedShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  const currentPage = navigation.find((item) => item.href === pathname)?.label ?? "Workspace";
  const drawerVisible = drawerOpen && drawerPath === pathname;
  useEffect(() => { if (!drawerOpen) return; const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setDrawerOpen(false); }; document.addEventListener("keydown", closeOnEscape); return () => document.removeEventListener("keydown", closeOnEscape); }, [drawerOpen]);
  return <div className="sans flex min-h-screen bg-[var(--paper)]"><aside className="hidden w-72 shrink-0 border-r border-[#29455b] bg-[var(--navy)] text-white md:flex md:flex-col"><div className="border-b border-[#29455b] px-7 py-7"><BrandMark light />{membership && <div className="mt-7 border-l-2 border-[var(--cyan)] pl-3"><p className="truncate text-sm font-semibold">{membership.organisationName}</p><p className="mt-1 text-xs text-slate-400">Current organisation</p></div>}</div><div className="flex-1 overflow-y-auto px-4 py-6"><NavigationLinks pathname={pathname} /></div><UserContext email={email} membership={membership} /></aside><div className={`fixed inset-0 z-50 md:hidden ${drawerVisible ? "visible" : "invisible"}`} aria-hidden={!drawerVisible}><button aria-label="Close navigation" className={`absolute inset-0 bg-[var(--navy)]/60 transition-opacity ${drawerVisible ? "opacity-100" : "opacity-0"}`} onClick={() => setDrawerOpen(false)} tabIndex={drawerVisible ? 0 : -1} /><aside aria-label="Mobile workspace navigation" aria-modal="true" className={`absolute left-0 top-0 flex h-full w-[min(88vw,22rem)] flex-col bg-[var(--navy)] text-white shadow-2xl transition-transform ${drawerVisible ? "translate-x-0" : "-translate-x-full"}`} role="dialog"><div className="flex items-center justify-between border-b border-[#29455b] px-6 py-6"><BrandMark light compact /><button aria-label="Close navigation" className="focus-ring px-2 py-1 text-2xl text-slate-300 hover:text-white" onClick={() => setDrawerOpen(false)}>×</button></div><div className="border-b border-[#29455b] px-6 py-5">{membership ? <><p className="truncate text-sm font-semibold">{membership.organisationName}</p><p className="mt-1 text-xs text-slate-400">{roleLabels[membership.role]}</p></> : <p className="text-sm text-slate-300">Workspace access setup</p>}</div><div className="flex-1 overflow-y-auto px-4 py-6"><NavigationLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} /></div><UserContext email={email} membership={membership} /></aside></div><main className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-[var(--line)] bg-white px-4 py-4 sm:px-6 md:px-10"><div className="flex min-w-0 items-center gap-3"><button aria-expanded={drawerVisible} aria-label="Open navigation" className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--line)] text-[var(--navy)] md:hidden" onClick={() => { setDrawerPath(pathname); setDrawerOpen(true); }}><span aria-hidden="true" className="text-xl">☰</span></button><div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-[var(--teal)]">Workspace</p><h1 className="truncate font-serif text-xl sm:text-2xl">{currentPage}</h1></div></div><div className="hidden text-right text-xs text-[var(--muted)] sm:block"><p className="font-semibold text-[var(--ink)]">{membership?.organisationName ?? "Authenticated session"}</p><p>{membership ? roleLabels[membership.role] : "Access setup required"}</p></div></header><div className="p-4 sm:p-6 md:p-10">{membership ? children : <section className="border border-[var(--line)] bg-white p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-wider text-[var(--teal)]">Workspace setup</p><h2 className="mt-3 font-serif text-2xl sm:text-3xl">Set up your workspace</h2><p className="sans mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Create an organisation or join one with an expiring invite code. No tenant information is displayed until membership is established.</p><Link className="focus-ring mt-6 inline-block bg-[var(--teal)] px-5 py-3 font-sans text-sm font-semibold text-white" href="/onboarding">Set up workspace</Link></section>}</div></main></div>;
}
