---
phase: 02-print-layout
plan: 04
subsystem: ui
tags: [crop-frame, aspect-ratio, guides, rulers, spec]

requires:
  - phase: 02-print-layout
    provides: "AU_PASSPORT_SPEC with frame fields and 46mm guide fractions (to revert)"
provides:
  - "AU_PASSPORT_SPEC without frame* fields, guides at /45 fractions"
  - "CropEditor at 35:45 aspect ratio with simple rulers"
affects: [02-print-layout]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/lib/state/spec.ts
    - src/lib/state/spec.test.ts
    - src/lib/components/CropEditor.svelte

key-decisions:
  - "Cutting buffer belongs only in PRINT_SHEET tile layout, not in crop frame or spec"

patterns-established: []

requirements-completed: [EXPP-01]

duration: 2min
completed: 2026-03-08
---

# Phase 2 Plan 4: Revert Crop Frame to 35:45 Summary

**Reverted crop frame from 36:46 to 35:45, removing cutting buffer from crop UI and guide fractions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T18:31:23Z
- **Completed:** 2026-03-08T18:33:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Removed frameWidthMm, frameHeightMm, frameAspectRatio, bufferMm from AU_PASSPORT_SPEC
- Reverted guide fractions to /45 denominators (crown: 4/45, 7/45; chin: 39/45, 40/45)
- Reverted CropEditor aspect ratio, rulers, and keyboard zoom to use 35:45 dimensions
- PRINT_SHEET constants left untouched (correctly owns its own tile/inset dimensions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Revert spec.ts guides and remove frame fields** - `917b733` (fix)
2. **Task 2: Revert CropEditor to 35:45 aspect ratio and simple rulers** - `00913ea` (fix)

## Files Created/Modified
- `src/lib/state/spec.ts` - Removed frame fields, reverted guide fractions to /45
- `src/lib/state/spec.test.ts` - Removed frame-specific tests, updated guide tests for /45
- `src/lib/components/CropEditor.svelte` - 35:45 aspect ratio, simple mm/H and mm/W rulers

## Decisions Made
- Cutting buffer belongs only in PRINT_SHEET tile layout, not in crop frame or spec

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Crop frame correctly displays at 35:45 with proper guide calibration
- Print sheet layout unaffected (has its own tile dimensions with buffer)

---
*Phase: 02-print-layout*
*Completed: 2026-03-08*
