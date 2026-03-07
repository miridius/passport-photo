---
phase: 02-print-layout
plan: 07
subsystem: ui
tags: [canvas, fillRect, cut-marks, print-layout]

# Dependency graph
requires:
  - phase: 02-print-layout
    provides: print sheet layout with tile positioning and cut marks
provides:
  - Correct cut mark geometry using fillRect (2mm x 0.5mm arms outside tile boundary)
affects: [02-print-layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fillRect for cut mark arms instead of stroked L-paths"

key-files:
  created: []
  modified:
    - src/lib/canvas/printSheet.ts
    - src/lib/canvas/printSheet.test.ts
    - src/lib/state/spec.ts
    - src/lib/state/spec.test.ts

key-decisions:
  - "CUT_MARK_LENGTH_MM restored to 2 (arm length, not confused with arm width)"
  - "Removed drawLMark helper and CUT_MARK_LINE_WIDTH_AT_300DPI — fillRect needs neither"

patterns-established:
  - "Cut mark arms use fillRect with explicit x,y,w,h — no stroke/lineTo complexity"

requirements-completed: [EXPP-02]

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 02 Plan 07: Cut Mark Geometry Summary

**Cut marks rewritten as 2mm-long x 0.5mm-wide fillRect arms extending outward from tile corners, replacing stroked L-paths**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T09:37:46Z
- **Completed:** 2026-03-09T09:41:48Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Rewrote drawCutMarks to use ctx.fillRect instead of stroked L-paths
- Changed CUT_MARK_LENGTH_MM from 0.5 back to 2 (the previous plan confused arm length with arm width)
- All 8 arms per tile sit entirely outside the tile bounding box
- Synced PRINT_SHEET.cutMark.lengthMm to 2, removed obsolete lineWidthAtDpi field

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite cut mark geometry** - `75c1c42` (feat)

_Note: TDD RED/GREEN committed together because the pre-commit hook runs tests and reverts on failure._

## Files Created/Modified
- `src/lib/canvas/printSheet.ts` - Replaced drawLMark/stroke with fillRect-based drawCutMarks
- `src/lib/canvas/printSheet.test.ts` - Rewrote tests: fillRect spy, 8 rects per tile, exact arm coordinates
- `src/lib/state/spec.ts` - PRINT_SHEET.cutMark.lengthMm = 2, removed lineWidthAtDpi
- `src/lib/state/spec.test.ts` - Updated cut mark assertions to match new spec

## Decisions Made
- CUT_MARK_LENGTH_MM restored to 2 (arm length, not confused with arm width)
- Removed drawLMark helper and CUT_MARK_LINE_WIDTH_AT_300DPI constant -- fillRect needs neither

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-commit hook runs tests and reverts files on failure, requiring all changes (implementation + tests) to be committed together rather than separate RED/GREEN TDD commits.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cut mark geometry is correct for UAT verification
- All unit tests pass (72/72)

---
*Phase: 02-print-layout*
*Completed: 2026-03-09*
