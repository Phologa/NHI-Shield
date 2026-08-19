# API Foundation

## `GET /api/health`

Liveness endpoint. Returns HTTP 200 with service status and a correlation ID. It does not query external dependencies.

## `GET /api/readiness`

Readiness endpoint. Returns HTTP 200 when required public Supabase configuration parses, otherwise HTTP 503. It never returns secret values.

## `POST /auth/signout`

Signs out the current Supabase session and redirects to `/sign-in`.

Future API handlers must call server-side authorization helpers before accessing organisation data and must generate or forward a correlation ID in logs.