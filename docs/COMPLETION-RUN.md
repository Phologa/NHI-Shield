# Completion run handoff

## What now works locally

- CSV is file-first: upload, parse, preview, row validation, explicit confirmation, transactional persistence, upsert where stable external keys exist, audit, and safe sample downloads.
- Incident analysis uses a 24-hour input bound, 15-minute repeated-denial window, future/stale-event rejection, request idempotency, active-incident detection keys, evidence timeline and lifecycle updates.
- `/api/jobs/repeat-analysis` is a secured, idempotent scheduler entry point. It honestly returns `configuration_required` until secrets exist.
- AI conversations are multi-turn and persisted per user, organisation and conversation. The provider receives only bounded data returned by controlled tenant-scoped tools. The UI renders safe internal citations and permission-aware navigation. With no provider configuration it saves the question and states that configuration is required; it never fabricates an answer.
- Remediation transitions now pass through a locked database function that enforces allowed transitions, stale-update protection and proposer/approver separation.
- Connector adapters define validation and normalisation while every cloud connector remains honestly unconfigured.
- Notification preferences and a durable outbox exist; delivery remains configuration-required.
- Reports include an authorised downloadable CSV with risks, incidents, remediation and audit records; formula-leading cells are neutralised.
- Overview is task-led and answers what matters, what is dangerous and what to do next.

## Environment requirements

- Existing: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Invitations/jobs: `SUPABASE_SERVICE_ROLE_KEY` (server only), `APP_URL`.
- Conversational AI: `OPENAI_API_KEY` and an explicitly selected `OPENAI_MODEL` (server only). Review tenant-data egress and retention before enabling.
- Scheduler: a random high-entropy `ANALYSIS_JOB_SECRET`; configure the scheduler to `POST /api/jobs/repeat-analysis` with `Authorization: Bearer <secret>`.
- Notifications: an email provider/SMTP configuration is still required. Outbox status must not be changed to `sent` until the provider confirms delivery.
- Connectors: provider-specific credentials in the deployment secret store. No genuine cloud connector sync is claimed in this build.

## Security QA matrix

For Viewer, Security Analyst and Organisation Admin in both Organisation A and B, test list/detail routes and forged IDs across inventory, resources, access, findings/evidence, incidents/activity, imports, AI conversations/tools, remediation, reports, invitations, members and audit. Include expired/replayed invites, malformed UUIDs, mass-assignment fields, CSV formula injection, stored HTML text, prompt injection in record names/evidence, AI requests for secrets/another tenant, and remediation replay/stale approval. Database-backed RLS testing requires an isolated Supabase test project and has not been faked locally.

## Remaining external/configuration work

Apply migrations 004/005 to staging, configure AI/scheduler/email only after security approval, implement and verify one provider connector with real least-privilege credentials, run live two-organisation/three-role browser and RLS tests, and perform keyboard/contrast/screen-reader testing with authenticated data.
