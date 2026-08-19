# Threat Model

## Assets

Sessions, organisation membership, roles, future machine identity data, audit records, and Supabase credentials.

## Primary threats and controls

- Cross-tenant relational joins: composite organisation/record foreign keys and RLS on every core security table.
- Secret ingestion: credential schema and validation accept metadata only; secret-value fields are intentionally absent.
- Non-reproducible risk claims: deterministic rules use central thresholds, bounded scores and evidence records.

## Residual risks

Production deployment still requires Supabase project controls, redirect URL configuration, secret management, rate limiting, monitoring retention policy, and an operational review of Auth provider settings.