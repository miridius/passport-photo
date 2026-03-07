---
phase: 02-print-layout
plan: 05
subsystem: canvas
tags: [cut-marks, print-layout, buffer-zone, geometry]

# Dependency graph
requires:
  - phase: 02-print-layout
    provides: printSheet.ts layout engine with tile positioning
provides:
  - 0.5mm buffer-zone cut marks delineating photo-to-tile boundary
  - Corrected EXPP-01/EXPP-03 requirements text
affects: [02-print-layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cut mark arm length matches INSET_MM (buffer width) for geometric consistency"

key-files:
  created: []
  modified:
    - src/lib/canvas/printSheet.ts
    - src/lib/canvas/printSheet.test.ts
    - .planning/REQUIREMENTS.md

key-decisions:
  - "CUT_MARK_LENGTH_MM changed from 2 to 0.5 to match buffer zone width"
  - "changeDpiBlob retained -- DPI metadata beneficial for DM print sizing even without 300 DPI mandate"
  - "PRINT_SHEET.cutMark.lengthMm in spec.ts left unchanged -- printSheet.ts uses its own constant"

patterns-established:
  - "Buffer-zone marks: arm length equals inset width for visual consistency"

requirements-completed: [EXPP-02, EXPP-03]

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 2 Plan 5: Cut Marks & DPI Requirements Summary

**Cut marks reduced from 2mm to 0.5mm L-shapes delineating the buffer zone between photo and tile edges, with REQUIREMENTS.md corrected for 9x13cm sheet and native-resolution DPI**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T18:31:29Z
- **Completed:** 2026-03-08T18:33:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Cut marks now exactly span the 0.5mm buffer zone at each photo corner (arms go from photo edge to tile edge)
- EXPP-01 corrected from "10x15cm" to "9x13cm" matching user-confirmed decision
- EXPP-03 corrected from "at 300 DPI" to "DPI metadata for correct physical sizing"
- changeDpiBlob call retained as it provides practical print benefit

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED): Failing tests for 0.5mm cut marks** - `917b733` (test)
2. **Task 1 (TDD GREEN): Implement 0.5mm cut marks** - `19bc927` (feat)
3. **Task 2: Update REQUIREMENTS.md** - `00913ea` (docs)

## Files Created/Modified
- `src/lib/canvas/printSheet.ts` - Changed CUT_MARK_LENGTH_MM from 2 to 0.5
- `src/lib/canvas/printSheet.test.ts` - Updated arm length expectations, renamed tests, added inset-length test
- `.planning/REQUIREMENTS.md` - Corrected EXPP-01 (9x13cm) and EXPP-03 (DPI metadata)

## Decisions Made
- CUT_MARK_LENGTH_MM changed from 2 to 0.5 -- arms now exactly match the buffer zone width (INSET_MM)
- changeDpiBlob(blob, 300) retained despite removing the "300 DPI" requirement text -- DPI metadata ensures correct physical sizing at DM Sofortfoto
- PRINT_SHEET.cutMark.lengthMm in spec.ts not updated here (printSheet.ts uses its own constant; spec.ts change deferred to avoid parallel plan conflict)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Cut marks correctly delineate the buffer zone for all 4 tiles
- Requirements text aligned with user-confirmed decisions
- Ready for Plan 06 (wave 2 integration)

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 02-print-layout*
*Completed: 2026-03-08*
