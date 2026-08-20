# Threat Model

## Assets

Sessions, organisation membership, roles, future machine identity data, audit records, and Supabase credentials.

## Primary threats and controls

- Cross-tenant relational joins: composite organisation/record foreign keys and RLS on every core security table.
- Secret ingestion: credential schema and validation accept metadata only; secret-value fields are intentionally absent.
- Non-reproducible risk claims: deterministic rules use central thresholds, bounded scores and evidence records.

## Residual risks

Production deployment still requires Supabase project controls, redirect URL configuration, secret management, rate limiting, monitoring retention policy, and an operational review of Auth provider settings.
# Completion-run additions

- AI prompt injection: imported and stored text is untrusted, bounded and supplied as record data; the model has no arbitrary SQL or mutation tool.
- Cross-tenant AI access: tools derive organisation from the authenticated membership and never accept an organisation ID.
- CSV secrets/formulas: secret-bearing headers are rejected and report exports neutralise spreadsheet formulas.
- Remediation replay/approval abuse: transitions are row-locked and enforced by a database function; proposers cannot approve their own work.
- Scheduler abuse: the job endpoint requires a server-held bearer secret and service role. Missing configuration fails closed.
- Membership mass assignment and role escalation: authenticated clients have no direct membership mutation policy; audited RPCs verify organisation-admin authority and reject platform-admin assignment, self-demotion and self-removal.
- Invite replay and misuse: only a hash is stored; acceptance locks the invite row and checks revocation, expiry, use count, intended role and optional email restriction before creating membership and audit records atomically.
