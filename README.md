# NHI Shield

NHI Shield is an enterprise foundation for machine identity and access security. Milestone 1 establishes the secure application, authentication, tenant, RBAC, database, observability, and testing boundaries. It intentionally contains no security engine, findings, incidents, AI analysis, or remediation logic.

## Architecture

The application is a single Next.js App Router deployment. Supabase provides PostgreSQL and Auth. Server components and route handlers use the SSR client; the browser client is limited to sign-in. Organisation membership and PostgreSQL RLS provide defence in depth, while server-side authorization remains authoritative. See [docs/architecture.md](docs/architecture.md).

## Local setup

1. Install Node.js 20+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add the public Supabase URL and anon key. The service-role key is optional for this milestone and must remain server-only.
4. Apply `supabase/migrations/202608190001_foundation.sql` in the Supabase SQL editor or with the Supabase CLI.
5. Create a user in Supabase Auth and add its UUID to `memberships` with an organisation UUID.

## Commands

`npm run dev` starts development. `npm run lint` runs ESLint. `npm run typecheck` runs strict TypeScript checking. `npm test` runs the automated tests. `npm run build` creates the production build.

## Supabase

Create a Supabase project, enable the desired Auth provider, and run the migration. Never expose `SUPABASE_SERVICE_ROLE_KEY` through `NEXT_PUBLIC_*` variables or client code. `/api/health` is liveness; `/api/readiness` reports whether public configuration is present.

## Documentation

- [Architecture](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [API](docs/api.md)
- [Milestone status](docs/STATUS.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
