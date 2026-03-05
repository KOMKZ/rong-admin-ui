#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/ci/quality-gate.sh" --risk "${RISK_LEVEL:-R2}" --report-dir "${REPORT_DIR:-.artifacts/quality-gate-local}"
