---
phase: 02-print-layout
plan: 01
subsystem: ui
tags: [css, aspect-ratio, print-layout, passport-spec, cutting-buffer]

# Dependency graph
requires:
  - phase: 01-cropping-tool
    provides: crop frame, rulers, guide bands, spec constants
provides:
  - 36:46 crop frame with 0.5mm cutting buffer
  - PRINT_SHEET constants for sheet layout (Plan 02)
  - Recalibrated guide bands for 46mm frame
affects: [02-02, 02-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Frame vs photo dimension separation (36:46 frame, 35:45 photo content)"
    - "Buffer offset in ruler positioning: ((buf + mm) / frameHeight) * 100%"

key-files:
  created: []
  modified:
    - src/lib/state/spec.ts
    - src/lib/state/spec.test.ts
    - src/lib/components/CropEditor.svelte
    - e2e/passphoto.test.ts

key-decisions:
  - "frameAspectRatio (36/46) added as new field, existing aspectRatio (35/45) kept for crop math"
  - "Guide fractions use (bufferMm + originalMm) / 46 formula for 46mm frame"
  - "Plan's margin calculation corrected: marginX = 6.5mm not 3.5mm (90 - 2*36 - 5) / 2"

patterns-established:
  - "Frame dimensions vs photo dimensions: frameWidthMm/frameHeightMm for display, photoWidthMm/photoHeightMm for crop/export math"

requirements-completed: [EXPP-01]

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 02 Plan 01: Crop Frame Resize Summary

**36:46 crop frame with 0.5mm cutting buffer, PRINT_SHEET constants, and recalibrated guide bands for print sheet prerequisite**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T14:38:34Z
- **Completed:** 2026-03-08T14:43:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added PRINT_SHEET constants with sheet (90x130mm), tile (36x46mm), photo (35x45mm), gap (5mm), and cut mark specifications
- Resized crop frame from 35:45 to 36:46 aspect ratio with 0.5mm buffer on all sides
- Recalibrated guide band fractions for 46mm frame while preserving 32mm/36mm face height distances
- Offset rulers by 0.5mm from frame edges while keeping 0-35mm / 0-45mm labels

## Task Commits

Each task was committed atomically:

1. **Task 1: Add PRINT_SHEET constants and recalibrate frame/guide dimensions** (TDD)
   - `9937301` test: add failing tests for PRINT_SHEET and 36:46 guide fractions
   - `05fe4e5` feat: implement PRINT_SHEET constants and recalibrated guides
2. **Task 2: Update crop frame, rulers, and exports for 36:46 aspect ratio** - `31966fd` (feat)

## Files Created/Modified
- `src/lib/state/spec.ts` - Added frameAspectRatio, frameWidthMm, frameHeightMm, bufferMm to AU_PASSPORT_SPEC; added PRINT_SHEET constant; recalculated crownGuide/chinGuide for 46mm frame
- `src/lib/state/spec.test.ts` - Tests for PRINT_SHEET constants, new frame fields, recalibrated guide fractions, margin computation
- `src/lib/components/CropEditor.svelte` - CSS aspect-ratio 36/46, ruler tick offset by buffer, keyboard zoom frame height
- `e2e/passphoto.test.ts` - Updated aspect ratio assertion (36:46), dimension bracket guide fractions (/46)

## Decisions Made
- Existing `aspectRatio` (35/45) kept for crop math compatibility; new `frameAspectRatio` (36/46) added
- Guide fractions recalculated as `(0.5 + originalMm) / 46` to position within 35x45mm inner zone of 46mm frame
- Plan stated marginX = 3.5mm but actual calculation gives 6.5mm -- corrected in tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected margin calculation in test**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Plan specified marginX = (90 - 2*36 - 5) / 2 = 3.5mm, but actual calculation is (90 - 77) / 2 = 6.5mm
- **Fix:** Updated test assertion from 3.5mm to 6.5mm (the correct value)
- **Files modified:** src/lib/state/spec.test.ts
- **Verification:** Test passes with correct margin value
- **Committed in:** 05fe4e5

**2. [Rule 3 - Blocking] Stub files from Plan 02 included in Task 1 commit**
- **Found during:** Task 1 commit
- **Issue:** printSheet.ts and printSheet.test.ts stubs were in working directory and got staged by a hook
- **Fix:** No fix needed -- stubs are harmless and will be implemented in Plan 02
- **Files modified:** src/lib/canvas/printSheet.ts, src/lib/canvas/printSheet.test.ts (stubs only)
- **Committed in:** 05fe4e5

---

**Total deviations:** 2 auto-fixed (1 bug in plan math, 1 blocking stub inclusion)
**Impact on plan:** Margin calculation was a plan error, not code error. Stub files are inert. No scope creep.

## Issues Encountered
- E2E tests could not run due to missing system library (`libnspr4.so`) for Playwright's Chromium browser. This is a pre-existing environment issue confirmed by testing the original code. Unit tests (70/70) all pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PRINT_SHEET constants ready for Plan 02 (print sheet layout calculator)
- 36:46 frame provides the cutting buffer needed for accurate print sheets
- Guide bands correctly positioned within the 35x45mm inner zone

---
*Phase: 02-print-layout*
*Completed: 2026-03-08*
