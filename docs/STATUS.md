# Project status

## Product position

NHI Shield is being developed to help organisations discover, understand, and control non-human and machine identities, credential/key metadata, access relationships, and related risk.

## Implemented and locally verified

- Organisation-scoped authentication context, role permissions, and migration-defined PostgreSQL row-level security.
- Organisation administrators and security analysts can reach a dedicated manual machine-identity registration flow; Viewers do not see mutation controls and receive a read-only response if they open the route directly.
- Manual server actions cover machine identities, credential metadata, resources, and access relationships. Organisation IDs come from authenticated membership context rather than submitted fields.
- Deterministic analysis evaluates current inventory and writes findings, evidence, and an audit event.
- CSV-only selection, required-schema guidance, downloadable examples, normalized supported headers, row preview, secret-bearing-column rejection, duplicate warnings, explicit confirmation, and server-side revalidation.
- The import action does not call persistence before explicit confirmation. Transactional persistence functions and post-import navigation are implemented and tested at the application boundary.
- Public pages share a restrained footer with accessible GitHub and LinkedIn links.
- The AI Security Analyst is implemented locally as a server-side, tenant-scoped, read-only analyst with structured evidence references, deterministic-result separation, permission-safe navigation, and a safe unconfigured state. Its pluggable model layer supports local/self-hosted OpenAI-compatible inference without an OpenAI key as well as optional OpenAI Responses API inference.

## Environment-dependent verification still required

- A real authenticated browser walkthrough of the complete manual workflow against the target Supabase project.
- Confirmation that target migrations `001` through `010` are applied before accepting live CSV persistence as end-to-end verified.
- Manual production application and acceptance of local migration `202608240001_activity_ingestion_detection_foundation.sql` before claiming live activity/detection-backed AI readiness.
- Server-only provider configuration and authenticated acceptance testing in the target deployment. Production self-hosted inference requires secured reachable compute; a developer-PC localhost runtime is not reachable from Vercel.
- Multi-organisation RLS and all-role browser testing in an isolated Supabase test project.
- Authenticated production verification of protected inventory and import routes.

## Future milestones, not current operational capabilities

- AI-driven remediation or privileged execution; the current analyst is intentionally read-only.
- Continuous monitoring and scheduled operations.
- Real connectors and automated discovery.
- Expanded monitoring of AI agents represented as machine identities.
- Controlled remediation hardening.
- Notifications and reporting operations.
- Pilot hardening, multi-tenant acceptance testing, and production observability.
