---
status: complete
phase: 01-cropping-tool-digital-export
source: 01-08-SUMMARY.md, 01-06-SUMMARY.md, 01-09-SUMMARY.md, 01-12-SUMMARY.md, 01-13-SUMMARY.md
started: 2026-03-08T01:25:00Z
updated: 2026-03-08T07:03:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Inverted Shift + Unified Zoom
expected: Scroll WITHOUT shift = coarse zoom (~5%). Shift+scroll = fine zoom (~1%). Keyboard +/- matches scroll zoom step size. Shift+arrows = fine pan.
result: issue
reported: "shift minus doesn't work"
severity: major
fix: Shift+'-' produces key '_'. Added case '_' and extracted keyToAction() with tests.

### 2. Hint Text Readability
expected: Keyboard hint below crop frame is clearly readable (not faint). Crown hint "top of skull, not hair" is readable against any photo background.
result: pass

### 3. Horizontal Ruler Alignment
expected: Ruler below crop frame (0mm-35mm) is perfectly aligned with the crop frame edges — no offset. Uses CSS Grid, not fragile margins.
result: issue
reported: "fail, whole layout is broken in fact"
severity: major
fix: Changed grid-template-columns from "auto 1fr auto" to "auto auto auto" — 1fr stretched center column beyond crop-frame width.

### 4. Export Buttons + Print Label
expected: Export buttons in spec panel area, visible without scrolling. Print button shows pixel dimensions (e.g. "1200×1543"), not mm.
result: pass
note: Verified in previous UAT round, no changes since plan 09.

### 5. HMR Persistence + No Flicker
expected: Load photo, adjust crop. Refresh the page. Photo and crop preserved. No flash of the upload/landing screen during restore.
result: pass
note: Rewrote HMR persistence from sessionStorage to import.meta.hot.data. Image loss on refresh is fine — only HMR needs preservation. Restored prerender=true. Removed isRestoring/skeleton.

## Summary

total: 5
passed: 3
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Shift+minus zooms out (fine precision)"
  status: fixed
  reason: "User reported: shift minus doesn't work"
  severity: major
  test: 1
  root_cause: "Shift+'-' produces key '_' which wasn't handled in the switch statement"
  artifacts:
    - path: "src/lib/components/cropTransform.ts"
      issue: "keyToAction missing '_' case"
  missing: []

- truth: "Horizontal ruler aligned with crop frame edges"
  status: fixed
  reason: "User reported: whole layout is broken"
  severity: major
  test: 3
  root_cause: "CSS Grid 1fr center column stretched beyond crop-frame fixed width"
  artifacts:
    - path: "src/lib/components/CropEditor.svelte"
      issue: "grid-template-columns used 1fr instead of auto"
  missing: []
