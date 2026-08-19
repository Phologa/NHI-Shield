# Milestone Status

## Current milestone

Milestone 1: Platform Foundation.

## Implemented

- Next.js App Router, strict TypeScript, Tailwind CSS, ESLint, and Vitest configuration.
- Supabase SSR server client, restricted browser client, session middleware, sign-in, and sign-out.
- Organisation and membership model with four roles and server-side permission checks.
- Structured secret-filtering logger, correlation IDs, health, and readiness endpoints.
- Authenticated command-centre shell with navigation-only empty states.
- Architecture, threat model, and API documentation.

## Repository structure

`app` routes and UI, `lib` platform/domain modules, `supabase/migrations` SQL, `tests` security tests, `docs` engineering documentation.

## Database migrations

`202608190001_foundation.sql` creates `organisations`, `memberships`, the membership role enum, RLS, and membership policies.

## Tests and checks

Tests cover role permissions, cross-organisation denial, and invalid environment configuration. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass. The production build reports a non-blocking Next.js warning that the `middleware` convention is deprecated in favor of `proxy`.

## Known issues and setup requirements

Supabase credentials and a configured Auth user are required for interactive sign-in. The local environment used to create this repository currently blocks or stalls npm dependency installation under its script policy, so checks must be rerun after installation succeeds.

## Exact next milestone

Milestone 2: Machine Identity Inventory and Data Ingestion. Do not implement it as part of Milestone 1.