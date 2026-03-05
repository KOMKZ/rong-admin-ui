#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "$SCRIPT_DIR/quality-gate.sh" --risk "${RISK_LEVEL:-R3}" --report-dir "${REPORT_DIR:-.artifacts/quality-gate-ci}"
