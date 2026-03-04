#!/bin/bash
set -e

echo "============================================"
echo "  Rong Admin UI - Quality Gate (Phase 1)"
echo "============================================"
echo ""

PASS=0
FAIL=0
SKIP=0

run_gate() {
  local name="$1"
  local cmd="$2"
  local hard="$3"

  echo "--- [$name] ---"
  if eval "$cmd" 2>&1; then
    echo "  => PASS"
    PASS=$((PASS + 1))
  else
    if [ "$hard" = "hard" ]; then
      echo "  => FAIL (hard gate)"
      FAIL=$((FAIL + 1))
    else
      echo "  => SKIP/WARN (soft gate)"
      SKIP=$((SKIP + 1))
    fi
  fi
  echo ""
}

run_gate "TypeCheck" "npx vue-tsc --noEmit" "hard"
run_gate "ESLint"    "npx eslint src --ext .ts,.vue --max-warnings 0" "hard"
run_gate "Prettier"  "npx prettier --check 'src/**/*.{ts,vue,json}'" "hard"
run_gate "Unit Test" "npx vitest run" "hard"
run_gate "Coverage"  "npx vitest run --coverage 2>/dev/null || true" "soft"

echo "============================================"
echo "  Results: PASS=$PASS  FAIL=$FAIL  SKIP=$SKIP"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo "  BLOCKED: Hard gate failure detected."
  exit 1
else
  echo "  PASSED: All hard gates OK."
  exit 0
fi
