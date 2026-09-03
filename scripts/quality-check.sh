#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

export NO_COLOR=1
export FORCE_COLOR=0
export CLICOLOR=0
export CLICOLOR_FORCE=0

quality_tmp_dir="${TMPDIR:-/tmp}"
stage_log="$(mktemp "$quality_tmp_dir/guardiola-quality.XXXXXX")"

cleanup() {
  rm -f -- "$stage_log"
}

trap cleanup EXIT

strip_ansi() {
  node -e 'process.stdout.write(require("node:fs").readFileSync(0, "utf8").replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, ""))'
}

print_stage_log() {
  strip_ansi <"$stage_log" >&2
}

save_failure_log() {
  local stage_name="$1"
  local failure_log_dir="$repository_root/tmp/quality"
  local safe_stage_name="${stage_name// /-}"
  local failure_log="$failure_log_dir/${safe_stage_name}-$(date -u '+%Y%m%dT%H%M%SZ')-$$.log"

  mkdir -p "$failure_log_dir"
  strip_ansi <"$stage_log" >"$failure_log"
  printf '[quality] log: %s\n' "$failure_log" >&2
}

run_stage() {
  local stage_name="$1"
  local exit_code
  shift

  printf '[quality] %-16s ... ' "$stage_name"

  if "$@" >"$stage_log" 2>&1; then
    printf 'ok\n'
    return
  else
    exit_code=$?
  fi

  printf 'failed\n' >&2
  save_failure_log "$stage_name"
  print_stage_log
  exit "$exit_code"
}

check_runtime() {
  command -v node >/dev/null
  command -v pnpm >/dev/null

  local node_major
  local expected_pnpm
  local actual_pnpm

  node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
  expected_pnpm="$(node -p 'require("./package.json").packageManager.split("@").pop()')"
  actual_pnpm="$(pnpm --version)"

  if ((node_major < 24)); then
    printf '[quality] Node.js 24 or newer is required; found %s.\n' "$(node --version)" >&2
    return 1
  fi

  if [[ "$actual_pnpm" != "$expected_pnpm" ]]; then
    printf '[quality] pnpm %s is required; found %s.\n' "$expected_pnpm" "$actual_pnpm" >&2
    return 1
  fi
}

check_diff() {
  git diff --check
  git diff --cached --check
}

run_stage "runtime versions" check_runtime
run_stage "source diff" check_diff
run_stage "lint" pnpm lint
run_stage "typecheck" pnpm typecheck
run_stage "build" pnpm build
run_stage "tests" pnpm test

printf '[quality] all checks passed\n'
