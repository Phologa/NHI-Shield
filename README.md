# NHI Shield

NHI Shield is being developed to help organisations discover, understand, and control non-human and machine identities, credential/key metadata, access relationships, and related risk.

## Current capabilities

- Organisation-scoped authentication, membership, role-based permissions, and PostgreSQL row-level security.
- Manual and CSV ingestion of machine identities, resources, credential metadata, and access relationships.
- CSV validation, preview, explicit confirmation, and tested atomic-persistence handling. Live target-database persistence still requires environment verification.
- Deterministic identity and access risk evaluation with findings, evidence, incidents, reports, and controlled remediation workflow.
- A server-side, tenant-scoped, read-only AI Security Analyst with pluggable local/self-hosted or optional OpenAI model inference; production inference remains environment-dependent until configured and accepted.
- Public website, protected security workspace, health/readiness endpoints, and automated security-focused tests.

## Current limitations

- AI-assisted investigation is implemented but is not operational in a deployment until a model provider is configured and accepted.
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

The current product path is deterministic: identity inventory links credential metadata to resources and access relationships, then produces evidence-backed findings and audit records. The AI page does not replace or alter that path.

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

- Local/self-hosted AI Analyst: `NHI_AI_PROVIDER=local`, `NHI_LOCAL_AI_BASE_URL`, `NHI_LOCAL_AI_MODEL`, and optional server-only `NHI_LOCAL_AI_API_KEY` for a protected endpoint. No `OPENAI_API_KEY` is required. The endpoint must expose OpenAI-compatible `/v1/chat/completions` structured output.
- Optional OpenAI AI Analyst: `NHI_AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL`.
- Invitations and privileged jobs: `SUPABASE_SERVICE_ROLE_KEY` and `APP_URL`.
- Scheduled analysis endpoint: `ANALYSIS_JOB_SECRET`.

Never commit real environment values, service-role keys, API keys, or secrets. All AI provider variables are server-only. A runtime on developer-PC `localhost` works for local development but is not reachable from Vercel; production requires a secured reachable self-hosted inference service and compute, so self-hosting does not imply zero infrastructure cost.

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
- [SITA progress report](docs/SITA-PROGRESS-REPORT.md)
- [Threat model](docs/threat-model.md)
