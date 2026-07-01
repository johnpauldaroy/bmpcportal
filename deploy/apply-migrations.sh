#!/usr/bin/env bash
# Applies the app's SQL migrations + seed to the self-hosted Postgres, in order.
# Run from the deploy/ directory after the stack is up and healthy.
#
# It connects through the localhost-exposed Postgres port (127.0.0.1:5432).
# Requires psql on the host, or run via the db container (see DB_VIA_CONTAINER).
#
# Usage:
#   set -a; . ./.env; set +a; ./apply-migrations.sh
#
# Migrations are NOT individually idempotent by framework, but the SQL itself
# uses "if not exists" / "create or replace" throughout, so re-running is safe.

set -euo pipefail

MIGRATIONS_DIR="../supabase/migrations"
SEED_FILE="../supabase/seed/0001_seed.sql"
STORAGE_POLICIES="../supabase/storage-policies.sql"

: "${POSTGRES_DB:?set POSTGRES_DB (source deploy/.env)}"
: "${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD (source deploy/.env)}"

PSQL=(psql "postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}" -v ON_ERROR_STOP=1)

echo "==> Applying migrations from ${MIGRATIONS_DIR}"
for f in $(ls "${MIGRATIONS_DIR}"/*.sql | sort); do
  echo "  -> $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

if [[ -f "${SEED_FILE}" ]]; then
  echo "==> Applying seed $(basename "${SEED_FILE}")"
  "${PSQL[@]}" -f "${SEED_FILE}"
fi

if [[ -f "${STORAGE_POLICIES}" ]]; then
  echo "==> Applying storage policies (owner-level; safe to skip if it errors)"
  "${PSQL[@]}" -f "${STORAGE_POLICIES}" || \
    echo "  !! storage-policies.sql failed (often needs the storage owner role). Review manually."
fi

echo "==> Done. Verify with: ${PSQL[*]} -c '\\dt public.*'"
