# NHI Shield: SITA Project Progress Report

## Positioning

NHI Shield is an AI cybersecurity monitoring platform under development, focused on non-human identity and access risk. The present milestone establishes a secure organisation-scoped workspace for ingesting security inventory data, mapping identity-to-resource access, and producing deterministic, evidence-backed risk findings.

This is what NHI Shield can demonstrate today; this is the roadmap we are seeking pilot and industry feedback on.

## Evidence standard

This report distinguishes three kinds of evidence:

- **Automated verification:** lint, TypeScript, tests, and production build pass.
- **Production smoke verification:** a public or unauthenticated route was exercised on the deployed application.
- **Live authenticated verification:** a signed-in workflow was exercised against the target Supabase and provider configuration.

Code presence alone is not reported as live operation.

## Current end-to-end workflow

An authorised organisation member can sign in to the protected workspace. The application is designed to accept machine identity, resource, credential-metadata, and access-relationship records through manual forms or a reviewed CSV workflow. The confirmed records feed organisation-scoped inventory and deterministic analysis views. The application then presents findings with evidence, identity details, access relationships, incidents, reports, and an audit trail. Actions are role-restricted and tenant-scoped.

The application boundary for this workflow is implemented and automated tests verify its key security and transaction rules. Full live persistence and multi-role tenant isolation still require an authenticated target-environment verification session before they can be claimed as demonstrated end to end.

## Capability status

| Capability | Status | Evidence and boundary |
| --- | --- | --- |
| Public website and sign-in page | **WORKING & VERIFIED** | Production smoke test verifies `/` and `/sign-in` render. |
| Protected-route authentication boundary | **WORKING & VERIFIED** | Production smoke test verifies an unauthenticated protected request redirects to sign-in; automated authorisation tests pass. |
| Organisation onboarding, create/join, invitations, and member roles | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Server actions, role rules, audited database functions, and automated security tests exist. Live two-account, multi-role testing against the target database has not been completed. |
| Overview and protected workspace navigation | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Routes build and use tenant-scoped repositories. Authenticated production behavior has not been exercised during this release pass. |
| Machine identity inventory and detail | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | List, search, filters, detail, manual entry, and tenant-scoped reads exist; build and tests pass. Live authenticated CRUD verification is outstanding. |
| Credential metadata | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Metadata-only validation and persistence path exist; secret values are rejected. Live target-database verification is outstanding. |
| Resources and access relationships/access graph | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Tenant-scoped forms, repositories, and views exist; production build passes. Live data verification is outstanding. |
| Deterministic risk analysis, findings, and evidence | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Deterministic rules and automated tests pass; findings/evidence routes build. A signed-in production demonstration against confirmed records is outstanding. |
| Audit log | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Organisation-filtered view and audited database functions exist. Live event creation and display have not been re-demonstrated in this pass. |
| Settings and role management | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Role-aware server actions and tests exist. Live administrator/analyst/viewer workflow verification is outstanding. |
| CSV Preview/Review to Confirm import | **WORKING & VERIFIED** | UI exposes explicit `Confirm import`; tests prove no database call occurs before confirmation, validated tenant rows reach the atomic RPC, and rejection refreshes nothing. |
| CSV live Supabase persistence and downstream analysis | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Persistence RPC and application path are implemented and tested at the server boundary. Target migration state and a real confirmed import were not available for safe verification. |
| Incidents and activity | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Manual activity and bounded deterministic detection exist; rule tests pass. No continuous event feed or live authenticated demonstration was verified. |
| AI Security Analyst interface and safety boundary | **IMPLEMENTED BUT NOT LIVE-CONFIGURED** | Grounded read-only context, citations, allow-listed navigation, `store: false`, and safe failure are implemented. Production has reported that AI configuration is required. |
| Authenticated production AI answers | **IMPLEMENTED BUT NOT LIVE-CONFIGURED** | Requires server-only `OPENAI_API_KEY` and `OPENAI_MODEL`, followed by redeployment and an authenticated question. No key or model is hard-coded or guessed. |
| Cloud data-source connectors | **PLACEHOLDER/NOT IMPLEMENTED** | Microsoft Entra ID, AWS, and Google Cloud are shown as Not Configured. No discovery or sync is simulated. |
| Controlled remediation workflow | **IMPLEMENTED BUT NOT END-TO-END VERIFIED** | Proposal, approval, manual-action states, separation of duties, and auditing are implemented. No autonomous remediation exists; live role workflow is outstanding. |
| Continuous monitoring, notifications, and scheduled operations | **PLACEHOLDER/NOT IMPLEMENTED** | Supporting configuration/data structures exist, but no verified production worker, connector sync, or notification delivery is operational. |

## Current limitations / not yet operational

- Production AI answers are not operational until `OPENAI_API_KEY` and `OPENAI_MODEL` are configured as server-only deployment variables and the deployment is reverified.
- Live CSV persistence is not yet accepted as end-to-end verified. Migrations `001` through `010` must first be confirmed in the target Supabase project.
- Multi-organisation and multi-role browser/RLS testing requires authorised test accounts and target-environment access.
- Cloud connectors do not ingest data. CSV and manual entry are the current ingestion mechanisms.
- There is no verified continuous monitoring worker, autonomous remediation, or production notification delivery.
- The present evidence demonstrates a validated application milestone, not a completed production security operations platform.

## Short SITA demonstration flow

Use only an environment where the target migrations and a test organisation are already confirmed.

1. Open the production home page and sign in with an authorised demonstration account.
2. Show the organisation-scoped Overview and role-aware navigation.
3. Open Import, select the supplied demonstration CSV, validate it, and review the row-level preview.
4. Show that nothing is stored before the explicit **Confirm import** action.
5. If live database readiness has been confirmed, complete the import and show import history, machine identities, access relationships, and deterministic findings with evidence.
6. Show the audit log and explain the distinction between observed, derived, and user-confirmed data.
7. Open AI Security Analyst only as an implemented, read-only interface unless the two production AI variables have been configured and an authenticated answer has already been verified.
8. Show Data Sources and identify the cloud connectors as Not Configured.

If database or AI readiness has not been confirmed before the meeting, stop the demonstration before those live actions and present the verified interface and automated evidence without claiming live operation.

## Exact manual verification still required

### CSV persistence

1. Confirm migrations `001`–`010` are present in the target Supabase migration ledger; do not apply missing migrations during a demonstration.
2. Sign in as an organisation administrator or security analyst in a disposable test organisation.
3. Import the supplied demo CSV, review all rows, and select **Confirm import**.
4. Verify the import history reports success and the expected row count.
5. Verify the imported identities, resources, credential metadata, and access relationships are visible only in that organisation.
6. Run/review deterministic analysis and confirm findings and evidence reference the imported records.
7. Remove the disposable test organisation/data using the authorised administrative process if cleanup is required.

### AI Analyst

1. Add `OPENAI_API_KEY` and `OPENAI_MODEL` to the Vercel Production environment as server-only values. `OPENAI_MODEL` must name a model available to the OpenAI project for the supplied key.
2. Redeploy without exposing either value to the browser or repository.
3. Sign in, ask “Which identities have the highest risk?”, and verify that the answer is grounded in authorised records, includes appropriate citations, and performs no write action.
4. Confirm organisation isolation with a second authorised test organisation before pilot use.

## Future milestones

- Live-configured AI-assisted monitoring and investigation, with broader answer-quality and grounding evaluation.
- Continuous monitoring and deterministic detection over verified operational data feeds.
- Least-privilege production connectors and automated ingestion for approved identity platforms.
- Controlled remediation execution with explicit approval, separation of duties, and complete audit evidence.
- Production notifications, scheduled reports, and operational observability.
- Pilot hardening: multi-tenant and multi-role validation, migration assurance, recovery testing, security review, governance, performance, and deployment controls.
- Broader enterprise and compliance capabilities guided by pilot and industry feedback.

These are planned milestones and are not represented as current operational capabilities.

## Proposition for discussion

NHI Shield can currently present a secure, evidence-oriented foundation for organisation-scoped non-human identity inventory and access-risk analysis. We are seeking SITA’s feedback on the relevance of this workflow, the data and governance requirements for a pilot, and the priority of the future monitoring, connector, AI-investigation, notification, and controlled-response milestones.
