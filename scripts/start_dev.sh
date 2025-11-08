#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/common/doppler.sh
source "$SCRIPT_DIR/common/doppler.sh"

PROJECT="${DOPPLER_PROJECT:-apartment-helper}"
CONFIG="${DOPPLER_CONFIG:-dev}" # default dev config name

require_doppler
ensure_doppler_login "$PROJECT" "$CONFIG"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if db_url="$(doppler_secret "$PROJECT" "$CONFIG" DATABASE_URL 2>/dev/null)"; then
    export DATABASE_URL="$db_url"
  else
    echo "[error] DATABASE_URL is not set locally and could not be retrieved from Doppler." >&2
    exit 1
  fi
fi

if [[ -z "${NEXTAUTH_SECRET:-}" ]]; then
  if nextauth_secret="$(doppler_secret "$PROJECT" "$CONFIG" NEXTAUTH_SECRET 2>/dev/null)"; then
    export NEXTAUTH_SECRET="$nextauth_secret"
  else
    echo "[warn] NEXTAUTH_SECRET is not configured; NextAuth flows may fail." >&2
  fi
fi

doppler_run "$PROJECT" "$CONFIG" npm run dev -- "$@"
