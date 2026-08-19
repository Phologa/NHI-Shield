# Milestone Status

> Updated 2026-08-19: The local build now includes organisation onboarding and invitations, CSV import, activity/incidents, a tenant-scoped AI guide mode, controlled manual remediation, honest connector setup states, live reports, and simplified plain-English navigation. The historical milestone notes below describe the earlier baseline.

## Completion-run update

- **Ask NHI Shield AI** is prominent and uses a small tenant-scoped read surface. It labels facts, deterministic assessment and unavailable AI interpretation. It has no arbitrary SQL, destructive tool or external provider egress.
- Remediation follows `proposed -> approved -> manual_action_required -> succeeded / failed / cancelled`; proposers cannot approve their own actions, and state changes are audited.
- Data Sources identifies CSV as available and Microsoft Entra ID, AWS and Google Cloud as **Not Configured** until real credentials, least-privilege scopes and a scheduled worker exist.
- Reports show current organisation facts and deterministic outputs. Scheduled email delivery is not configured.
- Migration `202608190004_ai_remediation_connectors.sql` is local only and must be manually reviewed/applied after migration 003.
- `APP_URL` plus `SUPABASE_SERVICE_ROLE_KEY` are required for invitation email delivery. SMTP remains a Supabase Auth configuration responsibility.
- External AI interpretation requires an explicitly approved tenant-data egress and retention design. No tenant security data currently leaves NHI Shield for AI.
- Remaining release gate: apply migrations 003/004 to staging and run full Organisation A versus Organisation B browser QA for Viewer, Security Analyst and Organisation Admin. Cross-tenant visibility is release-blocking.

## Latest validation

`npm run lint` passes with two non-failing server-action signature warnings; `npm run typecheck`, all 8 tests, and `npm run build` pass. The build generates 30 routes and reports only the existing middleware-to-proxy deprecation warning.

## Current milestone

Milestone 2.0: Core Security Engine.

## Implemented

- Next.js App Router, strict TypeScript, Tailwind CSS, ESLint, and Vitest configuration.
- Supabase SSR server client, restricted browser client, session middleware, sign-in, and sign-out.
- Organisation and membership model with four roles and server-side permission checks.
- Structured secret-filtering logger, correlation IDs, health, and readiness endpoints.
- Authenticated command-centre shell with navigation-only empty states.
- Architecture, threat model, and API documentation.
- Public NHI Shield website with Home, Platform, About, Security, Privacy, Contact, and Sign In experiences.
- Reusable NHI Shield brand mark and coherent public/protected visual system.
- Explicit public and protected route groups; protected navigation includes the requested AI Analyst route.
- Zod-validated pilot-request form that honestly reports its submission channel is still being configured.
- Static public environment references compatible with Next.js client-side replacement while retaining Zod validation.

## Repository structure

`app` routes and UI, `lib` platform/domain modules, `supabase/migrations` SQL, `tests` security tests, `docs` engineering documentation.

## Database migrations

`202608190001_foundation.sql` creates `organisations`, `memberships`, the membership role enum, RLS, and membership policies.

## Tests and checks

Tests cover role permissions, cross-organisation denial, and invalid environment configuration. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass. The production build reports a non-blocking Next.js warning that the `middleware` convention is deprecated in favor of `proxy`.

## Known issues and setup requirements

The Supabase issue was caused by public environment values being read through a dynamic `process.env` object. Next.js client replacement requires statically referenced `process.env.NEXT_PUBLIC_*` expressions. `.env.local` is correctly named, rooted, ignored by Git, and contains the two public variables; values are never logged. Interactive sign-in still requires a real Supabase Auth user with a membership row. Pilot-request persistence and delivery are not configured yet. Next.js also reports that the `middleware` convention is deprecated in favor of `proxy`.

## Core engine implementation

- Added migration `202608190002_core_security_engine.sql` for machine identities, credential metadata, resources, access relationships, findings, finding evidence, ingestion sources and audit events.
- Added composite organisation-aware foreign keys, indexes, updated-at triggers and RLS policies for all new security tables.
- Added tenant-scoped server context, repositories, validated server actions and deterministic risk rules.
- Added real manual inventory, identity detail, resource/access relationship, findings/evidence, overview and audit-log workflows.
- Credential registration explicitly stores metadata only; no secret values are accepted.
- Incidents, AI Security Analyst and Remediation remain not configured. No automatic connectors or discovery are claimed.

## Core engine limitations

The migration must be applied to the intended Supabase project before the new workflows can persist data. CSV import, external connectors, continuous monitoring, incidents, AI analysis and remediation belong to later milestones. Risk confidence is evidence quality, not compromise probability.

## Exact next milestone

Milestone 2.1: Detection and activity monitoring. Do not implement it as part of the Core Security Engine.
