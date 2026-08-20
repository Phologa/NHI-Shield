# CSV ingestion

CSV is the working MVP ingestion path. The recommended `security_inventory` file represents an identity and its optional resource access and credential metadata on each row. Provider plus external ID is the stable reference, so administrators never need database UUIDs. Repeated identities and resources are updated; access and credentials use stable composite keys. The database function runs as one transaction: either every validated row persists or none does.

The browser reads a selected `.csv` file locally, detects common heading aliases, displays the mapping, validates every row, shows actionable row errors, and requires explicit confirmation. The server repeats validation, derives the authenticated organisation, adds no caller-supplied tenant selector, and calls the bounded database import function. Import runs and audit events record completion and analysis readiness.

Password, secret, token-value, API-key-value, private-key, client-secret, credential-value, and secret-value columns are rejected. Credential type, label, lifecycle dates, and non-secret metadata are permitted. Imported facts use `observed` provenance. Derived and user-confirmed states are reserved separately and must never be presented as observed facts.

The downloadable demo contains an excessive-privilege AI agent, stale/inactive service account with retained access, old and expired credential metadata, broad access scope, orphaned identity, sensitive-resource access, privileged identities, dormant integration, conflicting ownership observations, and healthy comparison records.
