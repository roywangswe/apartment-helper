#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/common/doppler.sh
source "$SCRIPT_DIR/common/doppler.sh"

PROJECT="${DOPPLER_PROJECT:-apartment-helper}"
CONFIG="${DOPPLER_CONFIG:-prd}"

require_doppler
ensure_doppler_login "$PROJECT" "$CONFIG"

doppler_run "$PROJECT" "$CONFIG" npm run build -- "$@"
