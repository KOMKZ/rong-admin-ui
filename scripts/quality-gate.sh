#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

RISK=""
REPORT=""
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --risk)
      RISK="$2"
      shift 2
      ;;
    --report-dir)
      REPORT="$2"
      shift 2
      ;;
    *)
      EXTRA_ARGS+=("$1")
      shift
      ;;
  esac
done

RISK="${RISK:-${RISK_LEVEL:-R2}}"
REPORT="${REPORT:-${REPORT_DIR:-.artifacts/quality-gate-local}}"

bash "$SCRIPT_DIR/ci/quality-gate.sh" --risk "$RISK" --report-dir "$REPORT" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}"
