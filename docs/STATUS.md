# Project status

## Current release baseline

- Production release commit: `7dbed185902203cbc9d1a4676b4ee89c2eff1e46`.
- Phase history through `910a894` is preserved.
- The release passed lint, TypeScript, 30 automated tests, and a production webpack build.
- Public, sign-in, and unauthenticated AI-route smoke checks passed.

## Current capabilities

- Organisation-scoped authentication, roles, and row-level data isolation.
- Manual and transactional CSV ingestion for identity and access records.
- Deterministic security analysis, findings, evidence, incidents, reports, audit history, and controlled remediation.
- A grounded, read-only AI Analyst integration boundary using authorised records and internal citations.

## Configuration required

- AI answers require server-only `OPENAI_API_KEY` and `OPENAI_MODEL` deployment variables. Without both, questions are stored in the tenant-scoped conversation and no provider request or fabricated answer occurs.
- The target database must be verified as having migrations `001` through `010` in order before live import persistence is accepted as tested.
- Scheduled analysis, notification delivery, and cloud connectors require separate configuration and validation.

## Current limitations

- Continuous AI monitoring, autonomous remediation, and operational cloud sync are not current capabilities.
- Authenticated production AI and live CSV persistence require a configured test account and target-environment access for final verification.
- Multi-organisation and multi-role browser/RLS verification remains a public-release gate.

## Next public milestone

1. Configure and verify the existing AI provider integration without changing its grounded/read-only design.
2. Verify CSV preview, confirmation, persistence, import history, and downstream analysis against the target database.
3. Complete the repository and history audit, resolve findings, and repeat all release checks.
4. Change repository visibility only after explicit owner confirmation.

## Future milestones

- Least-privilege production connectors and scheduled ingestion.
- Production notification delivery and scheduled analysis operations.
- Expanded monitoring, AI evaluation, governance, and enterprise deployment controls.

Future milestones are not represented as implemented features.
