---
phase: 01-cropping-tool-digital-export
plan: 01
subsystem: ui
tags: [sveltekit, svelte5, vitest, changedpi, typescript, canvas]

# Dependency graph
requires: []
provides:
  - SvelteKit project scaffold with adapter-static and bun runtime
  - Type system (CropState, ImageState, ExportTarget, GuidePosition)
  - AU_PASSPORT_SPEC constants with guide band positions
  - Reactive crop state with pure applyPan/applyZoom functions
  - Off-screen canvas export module with DPI metadata injection
  - Test infrastructure with vitest (22 passing tests)
affects: [01-02, 01-03, 01-04]

# Tech tracking
tech-stack:
  added: [sveltekit, svelte5, vitest, changedpi, adapter-static, vite]
  patterns: [normalized-crop-coordinates, pure-function-transforms, off-screen-canvas-export]

key-files:
  created:
    - package.json
    - svelte.config.js
    - vite.config.ts
    - tsconfig.json
    - src/app.html
    - src/app.css
    - src/routes/+page.svelte
    - src/routes/+layout.js
    - src/lib/types.ts
    - src/lib/changedpi.d.ts
    - src/lib/state/spec.ts
    - src/lib/state/crop.svelte.ts
    - src/lib/canvas/export.ts
    - src/lib/state/spec.test.ts
    - src/lib/state/crop.svelte.test.ts
    - src/lib/canvas/export.test.ts
  modified: []

key-decisions:
  - "Package scripts invoke vite/vitest via bun directly (no node on PATH)"
  - "applyPan/applyZoom are pure functions separate from reactive state for testability"
  - "Offset clamping uses 1-zoomFraction as max bound for both axes"

patterns-established:
  - "Pure function transforms: applyPan/applyZoom take CropState, return new CropState"
  - "Normalized coordinates: offsets and zoom stored as 0-1 fractions of source image"
  - "TDD for math-heavy modules: spec constants and crop state tested before implementation"

requirements-completed: [LOAD-01, CROP-05, CROP-06]

# Metrics
duration: 5min
completed: 2026-03-07
---

# Phase 1 Plan 01: Project Scaffold Summary

**SvelteKit project with adapter-static, typed AU passport spec constants, reactive crop state with tested pan/zoom math, and canvas export module**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-07T16:24:23Z
- **Completed:** 2026-03-07T16:29:02Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- SvelteKit project scaffolded with adapter-static (SPA mode), changedpi, and vitest
- Type system established: CropState, ImageState, ExportTarget, GuidePosition
- AU_PASSPORT_SPEC with correct dimensions, face height fractions, guide band positions, and export targets
- Pure function crop transforms (applyPan, applyZoom) with clamping, fully tested
- Off-screen canvas export module ready for integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold SvelteKit project** - `95ae2ff` (feat)
2. **Task 2 RED: Failing tests** - `75d137a` (test)
3. **Task 2 GREEN: Implementation** - `eed6a8b` (feat)

## Files Created/Modified
- `package.json` - Project manifest with bun-compatible scripts
- `svelte.config.js` - adapter-static with SPA fallback
- `vite.config.ts` - Vitest test configuration
- `tsconfig.json` - TypeScript config extending SvelteKit generated config
- `src/app.html` - HTML shell
- `src/app.css` - Minimal CSS reset (box-sizing, margin, system-ui font)
- `src/routes/+page.svelte` - Placeholder page
- `src/routes/+layout.js` - Prerender enabled for static generation
- `src/lib/types.ts` - CropState, ImageState, ExportTarget, GuidePosition interfaces
- `src/lib/changedpi.d.ts` - Type declarations for changedpi library
- `src/lib/state/spec.ts` - AU_PASSPORT_SPEC constants and guide band positions
- `src/lib/state/crop.svelte.ts` - Reactive state + pure applyPan/applyZoom functions
- `src/lib/canvas/export.ts` - exportCrop (off-screen canvas + DPI) and triggerDownload
- `src/lib/state/spec.test.ts` - 10 tests for spec values and guide positions
- `src/lib/state/crop.svelte.test.ts` - 10 tests for pan/zoom clamping
- `src/lib/canvas/export.test.ts` - 2 tests for export function existence

## Decisions Made
- Package scripts use `bun node_modules/vite/bin/vite.js` instead of bare `vite` because the environment has no `node` binary on PATH (bun-only setup)
- applyPan and applyZoom are pure functions taking and returning CropState, separate from reactive `$state` for testability
- Offset clamping uses `[0, 1-zoomFraction]` as the valid range for both axes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Manual project scaffold instead of sv create**
- **Found during:** Task 1
- **Issue:** `bunx sv create` and `bun create svelte` both failed because they internally invoke `#!/usr/bin/env node` and no `node` binary exists on PATH (bun-only environment)
- **Fix:** Created all SvelteKit files manually (package.json, svelte.config.js, vite.config.ts, app.html, etc.) and ran `bun install`
- **Files modified:** All scaffold files
- **Verification:** `bun run build` succeeds, produces static output
- **Committed in:** 95ae2ff

**2. [Rule 3 - Blocking] Package scripts updated for bun runtime**
- **Found during:** Task 1
- **Issue:** Default `vite build` script fails with "node not found" because vite's bin shebang uses `#!/usr/bin/env node`
- **Fix:** Changed all scripts to `bun node_modules/vite/bin/vite.js` (and similar for vitest, svelte-kit, svelte-check)
- **Files modified:** package.json
- **Verification:** `bun run build` and `bun run test -- --run` both work
- **Committed in:** 95ae2ff

**3. [Rule 3 - Blocking] Added missing favicon.png**
- **Found during:** Task 1
- **Issue:** Build failed with "404 /favicon.png" because app.html references `%sveltekit.assets%/favicon.png` and prerender checks all links
- **Fix:** Created minimal 1x1 PNG in `static/favicon.png`
- **Files modified:** static/favicon.png
- **Verification:** Build passes without 404 errors
- **Committed in:** 95ae2ff

---

**Total deviations:** 3 auto-fixed (all Rule 3 blocking issues)
**Impact on plan:** All fixes necessary to work in bun-only environment. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All types, spec constants, and crop state ready for import by Plan 02 (interactive crop editor)
- Export module ready for integration by Plan 03
- Test infrastructure established -- new tests follow the same pattern

## Self-Check: PASSED

All 16 key files verified present. All 3 commits (95ae2ff, 75d137a, eed6a8b) verified in git log. 22 tests passing. Build succeeds.

---
*Phase: 01-cropping-tool-digital-export*
*Completed: 2026-03-07*
