# BMPC Portal

Production scaffold for the Barbaza Multi-Purpose Cooperative member portal and admin back office.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, and Edge Functions-ready architecture
- OpenRouter chat API with a free-model-only assistant
- PWA-first responsive shell

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

Service-role and OpenRouter keys are server-only. Do not import them into client components.

## Current Scaffold

- Member and admin route groups.
- Supabase SSR browser/server/middleware/admin clients.
- Login form with Supabase Auth.
- CSV import preview and validation shell.
- Loan application workflow entry point.
- Knowledge-base-only AI chat route and UI.
- QR verification route scaffold.
- PWA manifest, service worker, and app icons.
- Initial SQL schema with enums, indexes, foreign keys, and RLS policy outline.

## Architecture Docs

- [Folder structure](docs/architecture/folder-structure.md)
- [Dependency plan](docs/architecture/dependency-plan.md)
- [Implementation roadmap](docs/architecture/implementation-roadmap.md)

## Supabase

Initial migration:

```bash
supabase db push
```

Seed data:

```bash
supabase db reset
```

Create default admin and member login users after setting `SUPABASE_SERVICE_ROLE_KEY`
in `.env.local`:

```bash
npm run seed:users
```

Default dev credentials are `admin@bmpc.test` / `Admin12345!` and
`member@bmpc.test` / `Member12345!`. Override them with the `BMP_*` variables
from `.env.example`.

Private storage buckets to create:

- `loan-attachments`
- `share-certificates`
- `membership-ids`
- `csv-imports`
- `knowledge-documents`

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```
