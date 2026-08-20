# Migration ledger

No migration is applied automatically by this repository.

| Migration | Purpose | Local status | Remote status |
|---|---|---|---|
| `202608190001_foundation.sql` | Organisations, membership, inventory and tenant RLS | Versioned | Verify in target Supabase |
| `202608190002_core_security_engine.sql` | Findings, evidence, access and audit | Versioned | Verify in target Supabase |
| `202608190003_onboarding_activity_incidents.sql` | Invites, activity and incidents | Versioned | Earlier operator report says applied; verify manually |
| `202608190004_ai_remediation_connectors.sql` | Remediation, connector state and notification preferences | Versioned | Applied to NHI Shield production on 2026-08-20 |
| `202608190005_security_jobs_imports_remediation.sql` | Transactional imports, DB-enforced remediation transitions, idempotent detection, analysis runs, AI conversations and notification outbox | Versioned | Applied to NHI Shield production on 2026-08-20 |
| `202608190006_remediation_transition_enforcement.sql` | Remove the legacy direct remediation update path so status changes must use the audited transition RPC | Release hardening | Applied to NHI Shield production on 2026-08-20 |
| `202608200007_foundation_membership_hardening.sql` | User profiles, audited invite acceptance, and RPC-only invite/member mutations | Phase 1 complete locally | Unapplied; review and validate in staging before any remote application |

Manual process: back up the target database; review migrations in order; apply to staging with the Supabase migration workflow; run the Organisation A/B test matrix; only then promote using the organisation’s change process. Migration 005 depends on 004 and is required by CSV confirmation, conversational AI persistence, repeated analysis, and DB-enforced remediation.
