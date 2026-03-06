#!/usr/bin/env bash
# pack-smoke.sh — Verify that npm-packed tarball can be consumed by rong-admin-webdemo
set -euo pipefail

UI_DIR="${UI_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
WEB_DIR="${WEB_DIR:-$UI_DIR/../rong-admin-webdemo}"
TMPDIR_ROOT="${TMPDIR:-/tmp}"
WORK_DIR="$TMPDIR_ROOT/rong-pack-smoke-$$"

cleanup() { rm -rf "$WORK_DIR"; }
trap cleanup EXIT

echo "[pack-smoke] UI_DIR=$UI_DIR"
echo "[pack-smoke] WEB_DIR=$WEB_DIR"

# 1) Build UI
echo "[pack-smoke] Building UI..."
(cd "$UI_DIR" && npm run build)

# 2) Pack UI into tgz
echo "[pack-smoke] Packing UI..."
mkdir -p "$WORK_DIR"
TGZ=$(cd "$UI_DIR" && npm pack --pack-destination "$WORK_DIR" 2>/dev/null | tail -1)
TGZ_PATH="$WORK_DIR/$TGZ"

if [[ ! -f "$TGZ_PATH" ]]; then
  echo "[pack-smoke] FAIL: npm pack did not produce $TGZ_PATH" >&2
  exit 1
fi
echo "[pack-smoke] Packed: $TGZ_PATH"

# 3) Install tgz into web (temp override)
echo "[pack-smoke] Installing tgz into web..."
cp "$WEB_DIR/package.json" "$WORK_DIR/package.json.bak"

(cd "$WEB_DIR" && npm install "$TGZ_PATH" --no-save --install-links 2>&1)

# 4) Build web
echo "[pack-smoke] Building web with packed dependency..."
BUILD_OK=true
(cd "$WEB_DIR" && npm run build) || BUILD_OK=false

# 5) Restore original package.json linkage
cp "$WORK_DIR/package.json.bak" "$WEB_DIR/package.json"
(cd "$WEB_DIR" && npm install --no-audit --no-fund 2>&1)

if [[ "$BUILD_OK" != "true" ]]; then
  echo "[pack-smoke] FAIL: web build failed with packed tgz" >&2
  exit 1
fi

# 6) Verify CSS file exists in build output
if [[ ! -f "$WEB_DIR/dist/index.html" ]]; then
  echo "[pack-smoke] FAIL: web dist/index.html not found" >&2
  exit 1
fi

echo "[pack-smoke] PASS: web builds successfully with npm-packed @rong/admin-ui"
