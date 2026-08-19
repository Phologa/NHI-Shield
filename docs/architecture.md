# Architecture

NHI Shield is a modular monolith. Next.js owns the UI, protected server-rendered routes, and small operational route handlers. Domain boundaries live in `lib`: `supabase` owns platform clients, `security` owns authorization, `logging` owns structured events, and `env` owns configuration parsing.

## Request trust model

The browser may request a route, but it does not establish identity, organisation, role, or permission. The server refreshes the Supabase session, reads the authenticated user, queries membership for the requested organisation, and checks the permission. Database RLS independently restricts rows to memberships. The service-role key is never imported by browser modules.

## Repository structure

`app/` contains routes and route handlers. `components/` is reserved for shared UI components. `lib/authentication`, `lib/database`, `lib/organisations`, `lib/security`, `lib/validation`, and `lib/logging` are explicit domain seams for later work. `supabase/migrations/` contains versioned SQL. `tests/` contains unit and authorization tests. `docs/` contains architecture and operating notes.