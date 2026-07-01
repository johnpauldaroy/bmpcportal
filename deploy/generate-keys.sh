#!/usr/bin/env bash
# Generates the ANON_KEY and SERVICE_ROLE_KEY JWTs for self-hosted Supabase.
# These are JWTs signed with your JWT_SECRET — Supabase's anon/service keys are
# just long-lived JWTs with a "role" claim, nothing more.
#
# Usage:
#   JWT_SECRET="your-secret" ./generate-keys.sh
# or, if deploy/.env already has JWT_SECRET:
#   set -a; . ./.env; set +a; ./generate-keys.sh
#
# Paste the two printed values into ANON_KEY / SERVICE_ROLE_KEY in deploy/.env.

set -euo pipefail

if [[ -z "${JWT_SECRET:-}" ]]; then
  echo "JWT_SECRET is not set. Export it or source deploy/.env first." >&2
  exit 1
fi

# 10-year expiry — these are infrastructure keys, rotated manually if leaked.
iat=$(date +%s)
exp=$((iat + 60 * 60 * 24 * 365 * 10))

b64url() {
  openssl base64 -e -A | tr '+/' '-_' | tr -d '='
}

sign() {
  local role="$1"
  local header='{"alg":"HS256","typ":"JWT"}'
  local payload="{\"role\":\"${role}\",\"iss\":\"supabase\",\"iat\":${iat},\"exp\":${exp}}"
  local h p data sig
  h=$(printf '%s' "$header" | b64url)
  p=$(printf '%s' "$payload" | b64url)
  data="${h}.${p}"
  sig=$(printf '%s' "$data" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | b64url)
  printf '%s.%s\n' "$data" "$sig"
}

echo "ANON_KEY=$(sign anon)"
echo "SERVICE_ROLE_KEY=$(sign service_role)"
