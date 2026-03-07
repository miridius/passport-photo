#!/usr/bin/env bash
# Build LD_LIBRARY_PATH for Playwright browsers on NixOS.
# Playwright browsers ship as prebuilt binaries that expect system libs
# at standard paths. On NixOS, these live in /nix/store.
# This script finds them and exports LD_LIBRARY_PATH.

set -euo pipefail

NEEDED_LIBS=(
  libnspr4.so libatk-1.0.so.0 libcups.so.2 libdbus-1.so.3
  libdrm.so.2 libgbm.so.1 libglib-2.0.so.0 libgtk-3.so.0
  libnss3.so libpango-1.0.so.0 libX11.so.6 libXcomposite.so.1
  libXdamage.so.1 libXext.so.6 libXfixes.so.3 libXrandr.so.2
  libxcb.so.1 libxkbcommon.so.0 libasound.so.2 libatspi.so.0
  libexpat.so.1 libXcursor.so.1 libXi.so.6 libXrender.so.1
)

LIBS=""
for lib in "${NEEDED_LIBS[@]}"; do
  path=$(find /nix/store -name "$lib" 2>/dev/null | head -1)
  if [ -n "$path" ]; then
    dir=$(dirname "$path")
    # Avoid duplicates
    if [[ ":$LIBS:" != *":$dir:"* ]]; then
      LIBS="${LIBS:+$LIBS:}$dir"
    fi
  fi
done

echo "$LIBS"
