# Architecture

NHI Shield is a modular monolith. Next.js owns the UI, protected server-rendered routes, and small operational route handlers. Domain boundaries live in `lib`: `supabase` owns platform clients, `security` owns authorization, `logging` owns structured events, and `env` owns configuration parsing.

## Request trust model

The browser may request a route, but it does not establish identity, organisation, role, or permission. The server refreshes the Supabase session, reads the authenticated user, queries membership for the requested organisation, and checks the permission. Database RLS independently restricts rows to memberships. The service-role key is never imported by browser modules.

Users without a membership are redirected to the create-or-join onboarding workflow. Invitations contain a random one-time-displayed code; only its SHA-256 hash is persisted. Expiry, use limits, optional email restriction and intended role are checked in a locked database function. Direct membership and invite mutations are not available to authenticated clients: audited security-definer functions enforce administrator authority, prevent self-demotion/removal and prevent customer promotion to platform administrator. `user_profiles` mirrors only the name and email needed for member administration; it does not expose auth credentials.

## Repository structure

`app/` contains routes and route handlers. `components/` is reserved for shared UI components. `lib/authentication`, `lib/database`, `lib/organisations`, `lib/security`, `lib/validation`, and `lib/logging` are explicit domain seams for later work. `supabase/migrations/` contains versioned SQL. `tests/` contains unit and authorization tests. `docs/` contains architecture and operating notes.

## Core security engine

Migration `202608190002_core_security_engine.sql` adds tenant-scoped machine identities, credential metadata, resources, access relationships, findings, finding evidence, ingestion source registry, and audit events. Composite organisation-aware foreign keys prevent an access relationship from connecting records across organisations. Every new table has RLS and server actions derive `organisation_id` from authenticated membership context.

Manual registration is implemented for machine identities, credential metadata, resources, and access relationships. No cloud/IAM connector or automatic discovery is claimed. The normalized `source_type` and ingestion source registry are reserved for future connector adapters.

Credentials are metadata only. The schema has no field for passwords, API key values, tokens, private keys, or other secret material. Deterministic rules currently evaluate missing owners, elevated privilege, stale identities, expired credentials, credentials approaching expiry, and privileged access to high-sensitivity resources. Scores are bounded from 0 to 100. Confidence describes the quality and directness of rule evidence, not probability of compromise.

Findings retain structured evidence and are upserted by stable rule/subject identity so repeated manual analysis does not create duplicate active findings. Audit events record meaningful security actions without secret values. A future AI analyst must call permission-aware server domain functions over these evidence records; it must not receive arbitrary SQL access.

## Guided analysis and response

The NHI Shield AI Security Analyst uses a narrow server orchestration layer and pluggable provider abstraction. It can use a local/self-hosted open-weight model through an OpenAI-compatible HTTP endpoint without a commercial per-request API, or the optional OpenAI Responses API adapter. This is application-level security intelligence and grounding, not a foundation model trained from scratch. Authentication, organisation and role are derived before fixed read-only tools run. Tools select bounded non-secret fields and add the derived organisation filter; RLS remains an independent database boundary. Persisted strings are untrusted data and cannot alter tool scope. Either provider produces advisory interpretation only. NHI Shield constructs facts, deterministic assessments, evidence references and permission-safe routes, so provider prose cannot overwrite severity or risk results. Missing or unavailable provider configuration fails closed.

Remediation is a separate human-controlled domain. Analysts may propose an action; an organisation administrator other than the proposer must approve it. Current actions then enter `manual_action_required` and can be marked succeeded, failed or cancelled with audit events. Connector execution is reserved for a future verified adapter and is never implied by the manual path.
