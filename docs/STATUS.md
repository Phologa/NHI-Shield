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
- The AI page remains simplified and not live-configured; no AI provider or logic changes are part of this release.

## Environment-dependent verification still required

- A real authenticated browser walkthrough of the complete manual workflow against the target Supabase project.
- Confirmation that target migrations `001` through `010` are applied before accepting live CSV persistence as end-to-end verified.
- Multi-organisation RLS and all-role browser testing in an isolated Supabase test project.
- Authenticated production verification of protected inventory and import routes.

## Future milestones, not current operational capabilities

- AI-assisted investigation when separately configured and verified.
- Continuous monitoring and scheduled operations.
- Real connectors and automated discovery.
- Expanded monitoring of AI agents represented as machine identities.
- Controlled remediation hardening.
- Notifications and reporting operations.
- Pilot hardening, multi-tenant acceptance testing, and production observability.
