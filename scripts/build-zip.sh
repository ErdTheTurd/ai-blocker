#!/usr/bin/env bash
# Build a Chrome Web Store / Load-unpacked ZIP with manifest.json at the zip root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/dist"
ZIP="$OUT_DIR/nullgen-chrome.zip"
STAGE="$(mktemp -d)"

cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

mkdir -p "$OUT_DIR"
cp -a "$ROOT/manifest.json" "$ROOT/background" "$ROOT/content" "$ROOT/popup" \
  "$ROOT/options" "$ROOT/lib" "$ROOT/icons" "$ROOT/assets" "$STAGE/"

rm -f "$ZIP"
(
  cd "$STAGE"
  zip -r "$ZIP" . -x '*.DS_Store'
)

echo "Built $ZIP"
unzip -l "$ZIP" | head -20
test -f "$STAGE/manifest.json"
python3 - <<PY
import zipfile
z=zipfile.ZipFile("$ZIP")
names=z.namelist()
assert "manifest.json" in names, names
print("OK: manifest.json is at the ZIP root")
PY
