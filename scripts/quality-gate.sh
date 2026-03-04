#!/bin/bash
set -e

echo "============================================"
echo "  Rong Admin UI - Quality Gate (Phase 2)"
echo "============================================"
echo ""

PASS=0
FAIL=0

run_gate() {
  local name="$1"
  local cmd="$2"

  echo "--- [$name] ---"
  if eval "$cmd" 2>&1; then
    echo "  => PASS"
    PASS=$((PASS + 1))
  else
    echo "  => FAIL (hard gate)"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

run_gate "TypeCheck"     "npx vue-tsc --noEmit"
run_gate "ESLint"        "npx eslint src --ext .ts,.vue --max-warnings 0"
run_gate "Prettier"      "npx prettier --check 'src/**/*.{ts,vue,json}'"
run_gate "Unit+Coverage" "npx vitest run --coverage"

echo "============================================"
echo "  Results: PASS=$PASS  FAIL=$FAIL"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo "  BLOCKED: Hard gate failure detected."
  exit 1
else
  echo "  PASSED: All hard gates OK."
  exit 0
fi
