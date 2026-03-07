---
phase: 01-cropping-tool-digital-export
plan: 03
subsystem: ui
tags: [canvas-export, changedpi, dpi-metadata, svelte5, responsive-layout]

# Dependency graph
requires:
  - phase: 01-cropping-tool-digital-export/01
    provides: "ExportTarget types, AU_PASSPORT_SPEC export targets, exportCrop stub, changedpi"
  - phase: 01-cropping-tool-digital-export/02
    provides: "CropEditor, PhotoLoader, panZoom action, cropState/imageState"
provides:
  - Complete export pipeline with calculateSourceRect, DPI metadata injection, and triggerDownload
  - ExportButtons component with print PNG and digital JPEG download buttons
  - SpecPanel with Australian passport photo requirements and child-specific rules
  - Responsive two-column layout (desktop) / single-column (mobile)
  - PhotoLoader compact mode for in-header "Change photo" button
affects: [01-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-source-rect, responsive-grid-layout, details-element-collapsible]

key-files:
  created:
    - src/lib/components/ExportButtons.svelte
    - src/lib/components/SpecPanel.svelte
  modified:
    - src/lib/canvas/export.ts
    - src/lib/canvas/export.test.ts
    - src/lib/components/PhotoLoader.svelte
    - src/routes/+page.svelte
    - src/app.css

key-decisions:
  - "Extracted calculateSourceRect as pure function for testable source rect math without DOM"
  - "PhotoLoader gains compact prop for header placement instead of separate component"
  - "SpecPanel uses details element for child rules (collapsible on mobile, open by default)"

patterns-established:
  - "Pure function extraction: DOM-dependent logic wraps testable pure math (calculateSourceRect)"
  - "Responsive grid: single-column mobile, two-column desktop at 768px breakpoint"

requirements-completed: [EXPD-01, EXPD-02, INFO-01, INFO-02]

# Metrics
duration: 5min
completed: 2026-03-07
---

# Phase 1 Plan 03: Export Pipeline and Spec Panel Summary

**Canvas export with 300 DPI metadata via changedpi, print/digital download buttons, and Australian passport spec panel with child rules**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-07T16:38:50Z
- **Completed:** 2026-03-07T16:43:36Z
- **Tasks:** 2 (TDD: 3 commits across RED/GREEN phases + 1 task commit)
- **Files modified:** 7

## Accomplishments
- Complete export pipeline: calculateSourceRect pure function, off-screen canvas rendering, changeDpiBlob for 300 DPI metadata
- Two export buttons: print PNG (413x531) and digital JPEG (1200x1600) with loading states
- SpecPanel displaying all Australian passport photo requirements including child-specific rules
- Responsive layout: two-column desktop grid with spec sidebar, single-column mobile
- PhotoLoader compact mode in header for changing photos after initial load
- 4 new tests for calculateSourceRect, 28 total passing across all suites

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: calculateSourceRect failing tests** - `f1890b6` (test)
2. **Task 1 GREEN: export pipeline + ExportButtons** - `d03ea21` (feat)
3. **Task 2: SpecPanel, responsive layout, app.css polish** - `db35c1a` (feat)

## Files Created/Modified
- `src/lib/canvas/export.ts` - Added calculateSourceRect pure function, refactored exportCrop to use it
- `src/lib/canvas/export.test.ts` - 4 tests for source rect calculation (partial crop, full view, digital, min zoom)
- `src/lib/components/ExportButtons.svelte` - Print and digital download buttons with loading state
- `src/lib/components/SpecPanel.svelte` - Australian passport photo requirements with child-specific rules
- `src/lib/components/PhotoLoader.svelte` - Added compact prop for header "Change photo" button
- `src/routes/+page.svelte` - Responsive two-column layout with header, editor, exports, and spec panel
- `src/app.css` - System font stack, base resets, antialiasing

## Decisions Made
- Extracted `calculateSourceRect` as a pure function separate from `exportCrop` for DOM-free testing
- PhotoLoader gets a `compact` prop rather than creating a separate component for the header button
- SpecPanel uses a `<details>` element for child rules (collapsible, open by default)
- Light theme chosen (white background, dark text) for spec panel readability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Tool is functionally complete: load, position, download, reference specs
- Ready for Plan 04 (browser verification checkpoint)
- All 28 tests passing, build succeeds

## Self-Check: PASSED

All 7 key files verified present. All 3 commits (f1890b6, d03ea21, db35c1a) verified in git log. All 4 key_links verified. All min_lines requirements exceeded (75/30, 97/20, 129/30). 28 tests passing. Build succeeds.

---
*Phase: 01-cropping-tool-digital-export*
*Completed: 2026-03-07*
