#!/usr/bin/env bash
set -euo pipefail

# Build standalone Firecrawl CLI binaries for all platforms using Bun
#
# Usage:
#   ./scripts/build-binaries.sh          # build all targets
#   ./scripts/build-binaries.sh darwin    # build only macOS targets
#   ./scripts/build-binaries.sh linux     # build only Linux targets
#   ./scripts/build-binaries.sh windows   # build only Windows targets

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENTRY="$ROOT_DIR/src/index.ts"
OUT_DIR="$ROOT_DIR/dist/bin"

mkdir -p "$OUT_DIR"

TARGETS=(
  "bun-darwin-arm64:firecrawl-darwin-arm64"
  "bun-darwin-x64:firecrawl-darwin-x64"
  "bun-linux-x64:firecrawl-linux-x64"
  "bun-linux-arm64:firecrawl-linux-arm64"
  "bun-windows-x64:firecrawl-windows-x64.exe"
)

FILTER="${1:-all}"

build_target() {
  local target="$1"
  local outfile="$2"
  echo "Building $outfile (target: $target)..."
  bun build "$ENTRY" --compile --target="$target" --outfile "$OUT_DIR/$outfile"
  echo "  -> $OUT_DIR/$outfile"
}

for entry in "${TARGETS[@]}"; do
  target="${entry%%:*}"
  outfile="${entry##*:}"

  case "$FILTER" in
    all)    build_target "$target" "$outfile" ;;
    darwin) [[ "$target" == *darwin* ]] && build_target "$target" "$outfile" ;;
    linux)  [[ "$target" == *linux* ]]  && build_target "$target" "$outfile" ;;
    windows) [[ "$target" == *windows* ]] && build_target "$target" "$outfile" ;;
    *)      echo "Unknown filter: $FILTER (use all, darwin, linux, windows)"; exit 1 ;;
  esac
done

# Generate checksums
echo ""
echo "Generating checksums..."
cd "$OUT_DIR"
shasum -a 256 firecrawl-* > checksums.txt 2>/dev/null || sha256sum firecrawl-* > checksums.txt
echo "Checksums written to $OUT_DIR/checksums.txt"
cat checksums.txt
echo ""
echo "Done. Binaries are in $OUT_DIR/"
