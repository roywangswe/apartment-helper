#!/usr/bin/env bash
set -euo pipefail

require_doppler() {
  if ! command -v doppler >/dev/null 2>&1; then
    cat <<'MSG' >&2
[error] Doppler CLI is not installed. Install it from https://docs.doppler.com/docs/install-cli or export a DOPPLER_TOKEN.
MSG
    exit 1
  fi
}

ensure_doppler_login() {
  local project="$1"
  local config="$2"

  if ! doppler run --project "$project" --config "$config" -- /usr/bin/env true >/dev/null 2>&1; then
    cat <<MSG >&2
[error] Doppler CLI is not authenticated for project "$project" and config "$config".
Authenticate with 'doppler login' or set a DOPPLER_TOKEN before running this command.
MSG
    exit 1
  fi
}

doppler_secret() {
  local project="$1"
  local config="$2"
  local key="$3"

  doppler secrets get "$key" --project "$project" --config "$config" --plain --no-file
}

doppler_run() {
  local project="$1"
  local config="$2"
  shift 2

  doppler run --project "$project" --config "$config" -- "$@"
}
