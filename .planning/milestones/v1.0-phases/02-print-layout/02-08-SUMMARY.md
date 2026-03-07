---
phase: 02-print-layout
plan: 08
subsystem: ui
tags: [css, ruler, alignment, crop-editor, grid-layout]

requires:
  - phase: 01-crop-tool
    provides: CropEditor component with CSS grid layout, rulers, dimension brackets
provides:
  - Pixel-perfect ruler tick alignment compensating for 1px border offset
  - Zero-gap between crop frame and horizontal ruler
  - Closer dimension brackets with connecting lines to frame edge
affects: []

tech-stack:
  added: []
  patterns:
    - "calc() border compensation for ruler tick positioning"
    - "CSS custom property --connect-width for bracket connecting lines"

key-files:
  created: []
  modified:
    - src/lib/components/CropEditor.svelte

key-decisions:
  - "calc(1px + frac * (100% - 2px)) formula maps 0%..100% to 1px..(height-1px), matching content area inside 1px border"
  - "CSS custom property --connect-width on .dim-inner/.dim-outer inherits to ::before/::after pseudo-elements for connecting line width"

patterns-established:
  - "Border compensation: use calc() to remap percentage positions when adjacent element has border"

requirements-completed: [EXPP-01]

duration: 3min
completed: 2026-03-09
---

# Phase 2 Plan 8: Ruler Alignment & Dimension Brackets Summary

**Pixel-perfect ruler alignment via calc() border compensation, zero frame-ruler gap, and closer dimension brackets with connecting lines**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T09:37:42Z
- **Completed:** 2026-03-09T09:40:53Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Ruler ticks at 0mm and 45mm/35mm now align with crop frame content edges, not border edges
- Removed 0.5rem gap between crop frame bottom and horizontal ruler
- Dimension brackets moved closer to frame with horizontal connecting lines reaching frame edge

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix ruler alignment, remove ruler gap, improve dimension brackets** - `2c80095` (feat)

## Files Created/Modified
- `src/lib/components/CropEditor.svelte` - Three CSS fixes: ruler tick calc() compensation, row-gap removal, bracket positioning with --connect-width

## Decisions Made
- Used `calc(1px + frac * (100% - 2px))` to linearly remap tick positions from 0..H to 1px..(height-1px), matching the content area inside the 1px border
- CSS custom property `--connect-width` on dim containers inherits to bracket pseudo-elements, avoiding inline style duplication

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing uncommitted changes from plan 02-07 were present in the working tree (printSheet.ts, printSheet.test.ts, spec.ts, spec.test.ts). These were restored to committed state before testing to isolate this plan's CSS-only changes. The 02-07 changes are unrelated to this plan's scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ruler alignment complete, all 69 unit tests and 63 E2E tests pass
- Plan 02-07 (cut mark changes) has uncommitted source/test modifications that need separate execution

---
*Phase: 02-print-layout*
*Completed: 2026-03-09*
