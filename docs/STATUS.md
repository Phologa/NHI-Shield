# Milestone Status

## Current milestone

Milestone 1.5: Public Product Experience.

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

## Exact next milestone

Milestone 2: Machine Identity Inventory and Data Ingestion. Do not implement it as part of Milestone 1.5.