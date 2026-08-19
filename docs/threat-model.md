# Threat Model

## Assets

Sessions, organisation membership, roles, future machine identity data, audit records, and Supabase credentials.

## Primary threats and controls

- Cross-tenant reads: server membership checks and PostgreSQL RLS policies.
- Forged client role or organisation: role and organisation are read from authenticated membership, never trusted from browser input.
- Session theft: Supabase SSR cookies are refreshed in middleware and read server-side.
- Credential exposure: only public Supabase URL and anon key are available to browser code; service-role credentials are server-only.
- Sensitive log leakage: the logger filters fields containing key, token, secret, password, or cookie.
- Missing authorization regression: permission and cross-organisation tests run in CI.

## Residual risks

Production deployment still requires Supabase project controls, redirect URL configuration, secret management, rate limiting, monitoring retention policy, and an operational review of Auth provider settings.