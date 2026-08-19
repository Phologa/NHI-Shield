# Architecture

NHI Shield is a modular monolith. Next.js owns the UI, protected server-rendered routes, and small operational route handlers. Domain boundaries live in `lib`: `supabase` owns platform clients, `security` owns authorization, `logging` owns structured events, and `env` owns configuration parsing.

## Request trust model

The browser may request a route, but it does not establish identity, organisation, role, or permission. The server refreshes the Supabase session, reads the authenticated user, queries membership for the requested organisation, and checks the permission. Database RLS independently restricts rows to memberships. The service-role key is never imported by browser modules.

## Repository structure

`app/` contains routes and route handlers. `components/` is reserved for shared UI components. `lib/authentication`, `lib/database`, `lib/organisations`, `lib/security`, `lib/validation`, and `lib/logging` are explicit domain seams for later work. `supabase/migrations/` contains versioned SQL. `tests/` contains unit and authorization tests. `docs/` contains architecture and operating notes.

## Core security engine

Migration `202608190002_core_security_engine.sql` adds tenant-scoped machine identities, credential metadata, resources, access relationships, findings, finding evidence, ingestion source registry, and audit events. Composite organisation-aware foreign keys prevent an access relationship from connecting records across organisations. Every new table has RLS and server actions derive `organisation_id` from authenticated membership context.

Manual registration is implemented for machine identities, credential metadata, resources, and access relationships. No cloud/IAM connector or automatic discovery is claimed. The normalized `source_type` and ingestion source registry are reserved for future connector adapters.

Credentials are metadata only. The schema has no field for passwords, API key values, tokens, private keys, or other secret material. Deterministic rules currently evaluate missing owners, elevated privilege, stale identities, expired credentials, credentials approaching expiry, and privileged access to high-sensitivity resources. Scores are bounded from 0 to 100. Confidence describes the quality and directness of rule evidence, not probability of compromise.

Findings retain structured evidence and are upserted by stable rule/subject identity so repeated manual analysis does not create duplicate active findings. Audit events record meaningful security actions without secret values. A future AI analyst must call permission-aware server domain functions over these evidence records; it must not receive arbitrary SQL access.

## Guided analysis and response

The AI Analyst route currently operates in a safe local guide mode over a deliberately small, tenant-scoped read surface. It distinguishes persisted facts, deterministic assessments and unavailable AI interpretation. It has no arbitrary SQL, browser-side service credential, destructive tool or external provider egress. Connecting a hosted model requires an explicit data-sharing, retention and prompt-injection design review.

Remediation is a separate human-controlled domain. Analysts may propose an action; an organisation administrator other than the proposer must approve it. Current actions then enter `manual_action_required` and can be marked succeeded, failed or cancelled with audit events. Connector execution is reserved for a future verified adapter and is never implied by the manual path.
