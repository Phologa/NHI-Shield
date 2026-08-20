# AI Security Analyst boundary

The model never receives SQL, service credentials, an organisation selector or a destructive tool. Authentication, organisation and role are derived on the server. Each read tool adds the current organisation filter, caps results at 25 and returns selected non-secret fields. Retrieved strings are length-bounded, control characters are removed, and the provider instruction identifies all record content as untrusted data.

Answers must separate facts, deterministic assessment, AI interpretation and recommended next step. Confidence is evidence quality, never probability of compromise. Navigation comes from an application allow-list rather than model-generated URLs. The current provider call uses the OpenAI Responses API with storage disabled; the exact model is deployment-configured rather than hard-coded. No provider request occurs without both required variables.

## Deployment configuration

The existing implementation reads exactly two AI variables: `OPENAI_API_KEY` and `OPENAI_MODEL`. Both are server-only and both must be present. The model identifier is intentionally selected by the operator rather than invented or silently defaulted by the application. Configure the variables in each intended deployment environment, redeploy, then verify an authenticated question and the saved assistant response. Never place either value in a `NEXT_PUBLIC_*` variable or commit a real value to the repository.
