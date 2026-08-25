# AI Security Analyst trust boundary

The AI Security Analyst is a server-side, tenant-scoped, read-only investigation capability. A provider abstraction supplies advisory interpretation while authoritative facts, deterministic findings, severity, risk scores, evidence references, and routes are constructed from NHI Shield records.

## Request and grounding flow

1. The server authenticates the user and derives organisation membership and role. The browser does not submit an authoritative organisation identifier.
2. The action requires `view_security_data` and applies a per-user/per-organisation rate-limit hook.
3. Fixed read tools query selected columns from machine identities, credential metadata, resources, access relationships, findings, evidence, incidents, incident timeline, and recent activity. Every query adds the server-derived organisation filter; database RLS remains a second boundary.
4. Credential queries exclude `fingerprint_reference` and any secret, token, password, key material, or value field.
5. Retrieved strings are length-bounded. Persisted text and the organisation label are untrusted data, never instructions.
6. The provider receives no SQL, service-role credentials, arbitrary tools, organisation selector, remediation records, or mutation capability.
7. NHI Shield constructs structured facts, deterministic assessments, references, and allow-listed navigation separately from provider prose.

No conversation, answer, audit, remediation, role, invite, or credential record is written by this milestone. Existing AI conversation tables are not used by this read-only flow.

## Provider configuration

NHI Shield AI is the application-level analyst described above; it is not a foundation model trained from scratch. Its model provider is pluggable. Local/self-hosted inference is the path that avoids a paid per-request commercial AI API, while OpenAI remains an optional alternative.

For a local or self-hosted OpenAI-compatible runtime, set these server-only variables and restart or redeploy:

- `NHI_AI_PROVIDER=local`
- `NHI_LOCAL_AI_BASE_URL=http://127.0.0.1:11434`
- `NHI_LOCAL_AI_MODEL=<operator-selected open-weight model>`
- `NHI_LOCAL_AI_API_KEY=<optional bearer token for a protected endpoint>`

The local adapter calls `<base URL>/v1/chat/completions` with JSON Schema response formatting, a 700-token output cap, and a 20-second timeout. The optional key is sent only as a server-side bearer token when configured. The model is deliberately not hard-coded. For development, start an OpenAI-compatible runtime such as Ollama on the same machine, install an appropriate instruction-following model, set the model name exactly as the runtime exposes it, then run NHI Shield. The runtime must support the OpenAI-compatible chat-completions endpoint and structured JSON output.

`127.0.0.1` or `localhost` refers to the machine running the NHI Shield server. It works when both NHI Shield and the model runtime run on the same development machine. A Vercel deployment cannot reach a runtime on a developer PC through `localhost`; deployed NHI Shield needs a secured, reachable self-hosted inference endpoint and sufficient compute. This removes the commercial per-request API requirement, not the real infrastructure and operations cost of production inference.

Alternatively, configure OpenAI:

- `NHI_AI_PROVIDER=openai`
- `OPENAI_API_KEY=<deployment secret>`
- `OPENAI_MODEL=<operator-selected Responses API model>`

The OpenAI adapter uses the Responses API with `store: false`, JSON Schema structured output, a 700-token output cap, and a 20-second timeout. `OPENAI_API_KEY` is not read or required when `NHI_AI_PROVIDER=local`. Never use `NEXT_PUBLIC_*` for provider configuration or secrets. Missing configuration, an unavailable runtime, timeout, missing model, non-success response, empty response, or malformed schema fails closed and does not fabricate an answer. Provider output supplies only advisory interpretation and recommendations; deterministic facts and references are still built by NHI Shield.

## Supported investigations

- highest-risk identities and deterministic reasons;
- finding, evidence, incident, and timeline explanation;
- privileged access to critical resources;
- expired or expiring credential metadata;
- recent suspicious activity;
- investigation prioritisation; and
- safe product navigation and import guidance.

## Remaining boundary

AI cannot propose, approve, execute, or report completion of remediation. Remediation remains a separate human-controlled workflow. Any future AI-assisted remediation milestone requires a separate threat-model review.
