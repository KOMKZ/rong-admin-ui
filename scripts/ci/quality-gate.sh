#!/usr/bin/env bash
set -euo pipefail

RISK_LEVEL="R2"
REPORT_DIR=".artifacts/quality-gate"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --risk)
      RISK_LEVEL="$2"
      shift 2
      ;;
    --report-dir)
      REPORT_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
UI_DIR="${UI_DIR:-$ROOT_DIR}"
WEB_DIR="${WEB_DIR:-$ROOT_DIR/../rong-admin-web}"

if [[ ! -d "$UI_DIR" ]]; then
  echo "UI_DIR does not exist: $UI_DIR" >&2
  exit 2
fi

if [[ ! -d "$WEB_DIR" ]]; then
  echo "WEB_DIR does not exist: $WEB_DIR" >&2
  exit 2
fi

mkdir -p "$REPORT_DIR"
LOG_FILE="$REPORT_DIR/gate.log"
SUMMARY_FILE="$REPORT_DIR/summary.md"
RESULTS_FILE="$REPORT_DIR/results.tsv"

: > "$LOG_FILE"
: > "$RESULTS_FILE"

PASS=0
FAIL=0

run_in() {
  local dir="$1"
  local cmd="$2"
  (
    cd "$dir"
    bash -c "$cmd"
  )
}

run_gate() {
  local id="$1"
  local desc="$2"
  local cmd="$3"

  echo "--- [$id] $desc ---" | tee -a "$LOG_FILE"
  if eval "$cmd" >> "$LOG_FILE" 2>&1; then
    echo "$id	PASS	$desc" >> "$RESULTS_FILE"
    PASS=$((PASS + 1))
  else
    echo "$id	FAIL	$desc" >> "$RESULTS_FILE"
    FAIL=$((FAIL + 1))
  fi
}

enabled_gate_count() {
  case "$RISK_LEVEL" in
    R1) echo 4 ;;
    R2) echo 8 ;;
    R3) echo 10 ;;
    *)
      echo "Invalid risk level: $RISK_LEVEL (expected R1/R2/R3)" >&2
      exit 2
      ;;
  esac
}

GATE_1_CMD="run_in \"$UI_DIR\" \"npm run typecheck\" && run_in \"$WEB_DIR\" \"npm run typecheck\""
GATE_2_CMD="run_in \"$UI_DIR\" \"npm run lint\" && run_in \"$WEB_DIR\" \"npm run lint\""
GATE_3_CMD="run_in \"$UI_DIR\" \"npm run format:check\""
GATE_4_CMD="run_in \"$UI_DIR\" \"npm run test\" && run_in \"$WEB_DIR\" \"npm run test\""
GATE_5_CMD="run_in \"$UI_DIR\" \"npm run test:integration\""
GATE_6_CMD="run_in \"$UI_DIR\" \"npm run test:coverage\""
GATE_7_CMD="run_in \"$UI_DIR\" \"npm run test:changed\""
GATE_8_CMD="run_in \"$UI_DIR\" \"npm run gate:contract\""
GATE_9_CMD="run_in \"$WEB_DIR\" \"npm run gate:consumption\""
GATE_10_CMD="run_in \"$WEB_DIR\" \"npm run test:e2e:smoke\""

COUNT="$(enabled_gate_count)"

run_gate "G1" "typecheck" "$GATE_1_CMD"
run_gate "G2" "lint" "$GATE_2_CMD"
run_gate "G3" "format-check" "$GATE_3_CMD"
run_gate "G4" "unit" "$GATE_4_CMD"

if [[ "$COUNT" -ge 8 ]]; then
  run_gate "G5" "integration" "$GATE_5_CMD"
  run_gate "G6" "coverage-global" "$GATE_6_CMD"
  run_gate "G7" "coverage-changed" "$GATE_7_CMD"
  run_gate "G8" "contract-parity" "$GATE_8_CMD"
fi

if [[ "$COUNT" -ge 10 ]]; then
  run_gate "G9" "web-consumption" "$GATE_9_CMD"
  run_gate "G10" "e2e-smoke" "$GATE_10_CMD"
fi

{
  echo "# Quality Gate Summary"
  echo
  echo "- Risk Level: $RISK_LEVEL"
  echo "- UI_DIR: $UI_DIR"
  echo "- WEB_DIR: $WEB_DIR"
  echo "- PASS: $PASS"
  echo "- FAIL: $FAIL"
  echo "- Log: $LOG_FILE"
  echo
  echo "| Gate | Result | Description |"
  echo "|------|--------|-------------|"
  awk -F '\t' '{printf "| %s | %s | %s |\n", $1, $2, $3}' "$RESULTS_FILE"
} > "$SUMMARY_FILE"

cat "$SUMMARY_FILE"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

exit 0
