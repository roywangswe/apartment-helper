#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/common/doppler.sh
source "$SCRIPT_DIR/common/doppler.sh"

PROJECT="${DOPPLER_PROJECT:-apartment-helper}"
CONFIG="${DOPPLER_CONFIG:-dev}"
COMMAND="${1:-deploy}"
shift || true

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

case "$COMMAND" in
  deploy)
    doppler_run "$PROJECT" "$CONFIG" npx prisma migrate deploy "$@"
    ;;
  dev)
    doppler_run "$PROJECT" "$CONFIG" npx prisma migrate dev "$@"
    ;;
  status)
    doppler_run "$PROJECT" "$CONFIG" npx prisma migrate status "$@"
    ;;
  *)
    cat <<MSG >&2
Usage: $0 [deploy|dev|status] [-- additional Prisma args]

Commands:
  deploy   Apply pending migrations to the target database (default).
  dev      Create and apply a new development migration.
  status   Show Prisma migration status.
MSG
    exit 1
    ;;
fi
