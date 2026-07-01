# Self-hosting Supabase for the BMPC Portal on Dokploy

This migrates the backend **off Supabase's hosted platform and onto your own
VPS**, without changing the application code. You keep the entire stack
(Next.js + TypeScript, Postgres, ~130 RLS policies, 15 DB functions, Auth,
Storage) — only the URL and keys the app points at change.

**Why this instead of a Laravel rewrite:** your concern was cost at scale. A
language rewrite doesn't lower hosting cost; self-hosting does. Everything below
runs on your flat-rate 16 GB / 200 GB Dokploy VPS — no per-row, per-GB, or
per-user pricing.

---

## What's in this folder

| File | Purpose |
|---|---|
| `docker-compose.yml` | The Supabase stack (Postgres, Auth, REST, Storage, Kong gateway) |
| `kong.yml` | API gateway routes + anon/service-role key enforcement |
| `.env.example` | All config — copy to `.env` and fill in |
| `generate-keys.sh` | Generates the `ANON_KEY` / `SERVICE_ROLE_KEY` JWTs |
| `apply-migrations.sh` | Runs your 8 migrations + seed against the new DB |

---

## Step-by-step

### 1. Prepare config
```bash
cd deploy
cp .env.example .env
# Set POSTGRES_PASSWORD and JWT_SECRET (openssl rand -base64 48), plus your domains.
```

### 2. Generate the API keys
The anon/service keys are JWTs signed with `JWT_SECRET` — not random strings.
```bash
set -a; . ./.env; set +a
./generate-keys.sh
# Paste the two printed lines into ANON_KEY / SERVICE_ROLE_KEY in .env
```

### 3. Deploy the stack on Dokploy
- Create a new **Docker Compose** application in Dokploy pointing at this
  `deploy/` folder (or paste `docker-compose.yml`).
- Add the contents of `.env` as the app's environment.
- Deploy. Wait until `db` is healthy and all services are up.
- In Dokploy, add a **domain** routed to the `kong` service on port **8000**,
  with TLS. That domain is your `SUPABASE_PUBLIC_URL`.

### 4. Apply the database schema
From the VPS (psql talks to Postgres on localhost:5432):
```bash
cd deploy
set -a; . ./.env; set +a
./apply-migrations.sh
```
This creates all tables, RLS policies, the 15 functions, the 3 storage buckets
(`loan-attachments`, `csv-imports`, `knowledge-documents`), and seed data.

### 5. Create the seed users (admin + member)
The repo's existing script works against the new stack — just point it at the
new URL/keys:
```bash
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_PUBLIC_URL \
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY \
npm run seed:users
```

### 6. Repoint the app
In the **Next.js app's** environment (its own Dokploy app / `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://api.your-domain.com   # = SUPABASE_PUBLIC_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from step 2>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from step 2>
```
Redeploy the app. That's the only app change — no code edits.

### 7. Verify
- Sign in with a seeded user.
- Submit a loan application (exercises DB functions + storage upload).
- Open an admin loan detail → Uploads tab → preview an attachment (signed URLs).

---

## Migrating existing data (if your current Supabase has real data)

If you have production data on hosted Supabase to bring over:
```bash
# Dump from hosted Supabase (data only — schema comes from your migrations):
pg_dump "postgresql://postgres:[PW]@db.[REF].supabase.co:5432/postgres" \
  --data-only --schema=public --schema=storage > data.sql

# Load into the self-hosted DB AFTER apply-migrations.sh has built the schema:
psql "postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}" -f data.sql
```
Storage objects (files) must be copied separately from the hosted Storage
bucket into `storage-data` volume / re-uploaded.

---

## Resource sizing (16 GB / 200 GB)

Comfortable. Rough idle/typical footprint:
- Postgres ~300 MB–1 GB, Auth/REST/Storage/Kong ~100–200 MB each, Next.js
  app ~200–500 MB. Leaves the bulk of 16 GB for Postgres cache + growth.
- 200 GB disk: the DB itself is tiny; uploads (2 MB-capped IDs/signatures)
  dominate growth. Monitor `storage-data`.

## Operations
- **Backups:** schedule `pg_dump` of the `db` container + snapshot the
  `storage-data` and `db-data` volumes. Dokploy can run scheduled jobs.
- **Updates:** bump the image tags in `docker-compose.yml` deliberately; test
  on a staging deploy first.
- **What this stack omits** (add later if needed): Supabase Studio (DB UI),
  Realtime, Edge Functions, Analytics. The app uses none of them today.

---

## Security notes
- `deploy/.env` holds DB password + JWT secret + service-role key. Keep it out
  of git (already covered by the repo `.gitignore` patterns; verify).
- Postgres is bound to `127.0.0.1` only — not internet-exposed.
- Only Kong (8000) is public, behind Dokploy's TLS. The service-role key must
  never reach the browser; it's only used in the app's server routes.
