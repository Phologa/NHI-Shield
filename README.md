# NHI Shield

NHI Shield is being developed as an AI cybersecurity monitoring platform. The current milestone ingests company security data and analyses it for non-human identity and access risk.

## Current capabilities

- Organisation-scoped authentication, membership, role-based permissions, and PostgreSQL row-level security.
- Manual and CSV ingestion of machine identities, resources, credential metadata, and access relationships.
- CSV validation, preview, explicit confirmation, atomic persistence, duplicate handling, provenance, import history, and audit events.
- Deterministic identity and access risk evaluation with findings, evidence, incidents, reports, and controlled remediation workflow.
- An authenticated AI Security Analyst grounded in authorised organisation records. It provides citations and allow-listed navigation without direct database access or write tools.
- Public website, protected security workspace, health/readiness endpoints, and automated security-focused tests.

## Current limitations

- The AI Analyst requires an approved OpenAI API deployment configuration before it can return answers.
- CSV and manual entry are the operational ingestion paths. Cloud connectors and scheduled sync are not configured.
- Analysis is run from the application workflow; continuous AI monitoring is not claimed.
- Remediation is controlled and human-approved. Autonomous remediation is not implemented.
- Notification delivery and scheduled analysis require separate deployment configuration.
- Production readiness still requires live multi-organisation, multi-role, and database migration verification in the target environment.

## Architecture and workflow

NHI Shield is a Next.js App Router application backed by Supabase Auth and PostgreSQL. Server-side authorisation and database row-level security scope data to an organisation.

```text
CSV or manual input
        ↓
validate and confirm
        ↓
tenant-scoped PostgreSQL records
        ↓
deterministic risk analysis
        ↓
findings, evidence, incidents, reports
        ↓
grounded AI interpretation and controlled response workflow
```

The AI provider receives a bounded, non-secret context assembled by tenant-scoped read functions. Provider storage is disabled in the request. The model has no SQL access, organisation selector, secret access, arbitrary URL generation, or destructive tool.

## Setup

Requirements: Node.js 20+, npm, and a Supabase project.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and set the two required public Supabase values.
3. Review and apply the SQL migrations in `supabase/migrations` in filename order to an isolated environment first.
4. Run `npm run dev`.

Required base variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional server-only variables:

- AI Analyst: `OPENAI_API_KEY` and `OPENAI_MODEL` (both are required to enable provider calls).
- Invitations and privileged jobs: `SUPABASE_SERVICE_ROLE_KEY` and `APP_URL`.
- Scheduled analysis endpoint: `ANALYSIS_JOB_SECRET`.

Never commit real environment values, service-role keys, API keys, or secrets. The OpenAI variables must be configured only in the server deployment environment.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build -- --webpack
```

## Future milestones

- Verified least-privilege cloud identity connectors and scheduled ingestion.
- Production notification delivery and scheduled analysis operations.
- Broader monitoring coverage and operational observability.
- Further evaluation of AI answer quality, grounding, and tenant-data governance.
- Additional enterprise deployment and compliance controls.

These milestones are planned work, not current product capabilities.

## Documentation

- [Architecture](docs/architecture.md)
- [AI security boundary](docs/AI-SECURITY.md)
- [CSV ingestion](docs/INGESTION.md)
- [Migration ledger](docs/MIGRATIONS.md)
- [Current status](docs/STATUS.md)
- [Threat model](docs/threat-model.md)
