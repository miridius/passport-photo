#!/usr/bin/env bash
# Run a script with Playwright's required LD_LIBRARY_PATH on NixOS.
# Usage: ./scripts/playwright-run.sh <script.mjs>
set -euo pipefail
export LD_LIBRARY_PATH="$(./scripts/playwright-lib-path.sh)"
export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1
exec bun "$@"
