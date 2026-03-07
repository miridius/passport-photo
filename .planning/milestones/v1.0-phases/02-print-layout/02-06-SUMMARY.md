---
phase: 02-print-layout
plan: 06
subsystem: testing
tags: [playwright, e2e, vitest, spec-constants]

# Dependency graph
requires:
  - phase: 02-04
    provides: "35:45 crop frame revert (removed buffer from crop)"
  - phase: 02-05
    provides: "0.5mm cut marks implementation"
provides:
  - "E2E backdrop dismiss test for print preview dialog"
  - "Corrected E2E assertions matching 35:45 crop frame"
  - "PRINT_SHEET.cutMark.lengthMm synced to 0.5"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dialog backdrop click test via position: { x: 1, y: 1 }"

key-files:
  created: []
  modified:
    - "e2e/passphoto.test.ts"
    - "src/lib/state/spec.ts"
    - "src/lib/state/spec.test.ts"

key-decisions:
  - "Backdrop click at position {x:1, y:1} reliably hits dialog backdrop outside content area"

patterns-established: []

requirements-completed: [EXPP-01, EXPP-02]

# Metrics
duration: 1min
completed: 2026-03-08
---

# Phase 2 Plan 06: E2E Test Corrections Summary

**Backdrop dismiss E2E test added, aspect ratio assertions corrected to 35:45, cut mark spec synced to 0.5mm**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-08T18:36:20Z
- **Completed:** 2026-03-08T18:37:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added E2E test verifying print preview dialog closes on backdrop click
- Updated aspect ratio assertion from 36/46 to 35/45
- Updated dimension bracket fractions from /46 to /45
- Synced PRINT_SHEET.cutMark.lengthMm from 2 to 0.5

## Task Commits

Each task was committed atomically:

1. **Task 1: Add backdrop dismiss E2E test and fix assertions** - `0b888c2` (fix)
2. **Task 2: Sync PRINT_SHEET.cutMark.lengthMm with implementation** - `02b1c28` (fix)

## Files Created/Modified
- `e2e/passphoto.test.ts` - Backdrop dismiss test, 35:45 aspect ratio, /45 bracket fractions
- `src/lib/state/spec.ts` - cutMark.lengthMm changed from 2 to 0.5
- `src/lib/state/spec.test.ts` - Updated assertion to match 0.5

## Decisions Made
- Backdrop click at position {x:1, y:1} reliably hits dialog backdrop outside content area

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 fully complete: all 6 plans executed
- All E2E and unit tests aligned with current implementation
- Print sheet workflow has full E2E coverage

## Self-Check: PASSED

---
*Phase: 02-print-layout*
*Completed: 2026-03-08*
