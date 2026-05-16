#!/usr/bin/env bash
set -euo pipefail

BINARY_NAME=${1:-"mein-buero-mcp"}
OUTPUT="dist/${BINARY_NAME}"

# 1. Bundle to CJS (SEA requires CommonJS, not ESM)
npx esbuild src/index.ts \
  --bundle --platform=node --target=node22 \
  --format=cjs --outfile=dist/bundle.cjs

# 2. Generate SEA blob
node --experimental-sea-config sea-config.json

# 3. Locate node binary (cross-platform)
if [[ "${OS:-}" == "Windows_NT" ]]; then
  NODE_BIN=$(where.exe node 2>/dev/null | head -1 | tr -d '\r')
else
  NODE_BIN=$(which node)
fi

# 4. Copy node runtime
cp "$NODE_BIN" "$OUTPUT"

# 5. Remove macOS codesign before injection
if [[ "$OSTYPE" == "darwin"* ]]; then
  codesign --remove-signature "$OUTPUT" || true
fi

# 6. Inject blob via postject
MACHO_FLAG=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  MACHO_FLAG="--macho-segment-name NODE_SEA"
fi
# shellcheck disable=SC2086
npx postject "$OUTPUT" NODE_SEA_BLOB dist/sea-prep.blob \
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
  $MACHO_FLAG

# 7. Re-sign on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  codesign --sign - "$OUTPUT" || true
fi

chmod +x "$OUTPUT"
echo "Binary built: $OUTPUT"
