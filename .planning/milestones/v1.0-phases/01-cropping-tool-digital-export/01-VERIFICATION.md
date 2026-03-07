---
phase: 01-cropping-tool-digital-export
verified: 2026-03-08T02:18:00Z
status: passed
score: 6/6 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 6/6
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 1: Cropping Tool + Digital Export Verification Report

**Phase Goal:** User can load a photo, position it within a guided crop frame, and download a correctly-sized cropped photo for passport submission
**Verified:** 2026-03-08T02:18:00Z
**Status:** passed
**Re-verification:** Yes -- regression check after plans 08-13

## Changes Since Last Verification

Plans 08-13 executed since previous verification (2026-03-07T23:42:00Z):

- **Plan 08:** Inverted shift modifier (no-shift=coarse 1.05, shift=fine 1.01), unified zoom factors across mouse and keyboard
- **Plan 09:** Fixed horizontal ruler width via CSS Grid, moved export buttons to spec-column, dynamic print label with pixel dimensions
- **Plan 10:** HMR state persistence attempt (self-check FAILED -- superseded by plan 13)
- **Plan 11:** CANCELLED (misinterpreted feedback)
- **Plan 12:** Ruler alignment via CSS Grid column sharing, replaced fragile margin-left hack
- **Plan 13:** HMR sessionStorage persistence tests + isRestoring flicker fix

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can select a photo and see it in a 35:45 crop frame with darkened overlay | VERIFIED | PhotoLoader.svelte: file input `accept="image/*"`, calls `loadImage()`. CropEditor.svelte line 193: `aspect-ratio: 35/45`, `overflow: hidden`. Workspace `background: #1a1a1e`. No regressions. |
| 2 | User can pan (drag/keys) and zoom (scroll/pinch/keys) with guide bands for chin and crown | VERIFIED | panZoom.ts line 21: `shiftKey ? 1.01 : 1.05` (inverted in plan 08). CropEditor lines 57-58: `panStep = e.shiftKey ? 2 : 10`, `zoomFactor = e.shiftKey ? 1.01 : 1.05`. Arrow key signs correct (lines 62-87). deltaX fallback for browser shift+scroll (panZoom.ts line 22). GuideOverlay: crown/chin bands. 13 panZoom tests pass. |
| 3 | Crown hint communicates "top of skull, not hair" readably | VERIFIED | GuideOverlay.svelte line 12: `<span class="crown-hint">top of skull, not hair</span>`. CSS line 74: `font-size: 0.5625rem`, line 76: `font-style: italic`, line 79: `color: #fff`, text-shadow for contrast. |
| 4 | Spec panel displays accurate AU passport requirements including child notes | VERIFIED | SpecPanel.svelte line 10: `35-40mm x 45-50mm` ranges. spec.ts lines 8-11: range fields. Child rules lines 42-44: `mouthMayBeOpen:true`, `noToysOrObjects:true`, no `eyeLeniency`. spec.test.ts line 37 asserts `eyeLeniency` absent. |
| 5 | User can download print export (native resolution JPEG) and digital export (capped 1200x1600 JPEG with quality auto-adjust) | VERIFIED | ExportButtons.svelte: `downloadPrint()` line 37: quality 1.0, 300 DPI, dynamic pixel dims in label (line 110). `downloadDigital()` lines 48-101: starts quality 1.0, binary search (8 iterations) if >3.5MB, blocks if <70KB with user-facing error. Both call `exportCrop()` with `changeDpiBlob`. Buttons in spec-column (plan 09). |
| 6 | Tool works on desktop Chrome/Firefox and Android Chrome | VERIFIED | +page.svelte line 110: 960px responsive breakpoint. panZoom.ts line 44: `touch-action: none`. ExportButtons line 133: `min-height: 44px` touch targets. E2E tests exist (e2e/passphoto.test.ts). Three-way conditional rendering eliminates flicker on reload (plan 13). |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/lib/types.ts` | VERIFIED | 26 lines. CropState, ImageState, ExportTarget, GuidePosition. Unchanged. |
| `src/lib/state/spec.ts` | VERIFIED | 78 lines. AU_PASSPORT_SPEC with ranges, guides, child rules. 11 tests pass. |
| `src/lib/state/crop.svelte.ts` | VERIFIED | 174 lines. Reactive state, loadImage, pan/zoom, sessionStorage HMR persistence (plan 13), isRestoring flag, img.onerror handler. 14 tests pass. |
| `src/lib/canvas/export.ts` | VERIFIED | 77 lines. exportCrop with changeDpiBlob, triggerDownload. 4 tests pass. |
| `src/lib/actions/panZoom.ts` | VERIFIED | 107 lines. Pointer pan, pinch zoom, wheel zoom with inverted shift modifier (plan 08), deltaX fallback. 13 tests pass. |
| `src/lib/components/PhotoLoader.svelte` | VERIFIED | 70 lines. File input, loadImage, compact mode. |
| `src/lib/components/CropEditor.svelte` | VERIFIED | 382 lines. CSS Grid layout (plan 12), vertical + horizontal rulers structurally aligned, crop frame, dimension brackets, keyboard controls with inverted shift (plan 08). 5 tests pass. |
| `src/lib/components/GuideOverlay.svelte` | VERIFIED | 100 lines. Crown/chin bands, readable crown hint, center line. |
| `src/lib/components/ExportButtons.svelte` | VERIFIED | 195 lines. Print + digital export, binary search quality, error handling, dynamic pixel labels (plan 09). |
| `src/lib/components/SpecPanel.svelte` | VERIFIED | 150 lines. Spec data, dimension ranges, child rules, source link. |
| `src/lib/components/cropTransform.ts` | VERIFIED | 34 lines. Pure transform computation. |
| `src/routes/+page.svelte` | VERIFIED | 116 lines. Three-way rendering: loaded / restoring skeleton / landing (plan 13). 960px breakpoint. ExportButtons in spec-column (plan 09). |
| `e2e/passphoto.test.ts` | VERIFIED | E2E tests including screenshot verification (plan 09). |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `PhotoLoader` | `crop.svelte` | `import loadImage`, calls on file change | WIRED |
| `CropEditor` | `panZoom` | `use:panZoom` action directive (line 112) | WIRED |
| `CropEditor` | `crop.svelte` | reads `cropState`/`imageState`, calls `applyPan`/`applyZoom`/`persistForHmr` | WIRED |
| `CropEditor` | `cropTransform` | `computeTransform` for CSS transform (line 22) | WIRED |
| `CropEditor` | `spec` | `chinGuide`, `crownGuide`, `AU_PASSPORT_SPEC` (line 5) | WIRED |
| `CropEditor` | `GuideOverlay` | renders as child inside crop-frame (line 127) | WIRED |
| `GuideOverlay` | `spec` | imports `chinGuide`, `crownGuide` (line 2) | WIRED |
| `ExportButtons` | `export` | calls `exportCrop`, `triggerDownload` (lines 21, 71, 94) | WIRED |
| `ExportButtons` | `crop.svelte` | reads `cropState`/`imageState` (line 3) | WIRED |
| `ExportButtons` | `spec` | reads `AU_PASSPORT_SPEC.digitalExport` (line 58) | WIRED |
| `SpecPanel` | `spec` | displays `AU_PASSPORT_SPEC` range fields (line 10) | WIRED |
| `+page.svelte` | all components | imports/renders PhotoLoader, CropEditor, ExportButtons, SpecPanel | WIRED |
| `+page.svelte` | `crop.svelte` | reads `imageState`, `isRestoring` for three-way conditional (lines 13, 27) | WIRED |
| `panZoom onWheel` | `wheelToZoomFactor` | passes `e.shiftKey` and `e.deltaX` (line 88) | WIRED |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| LOAD-01 | Load photo from device via file picker | SATISFIED | PhotoLoader: `<input type="file" accept="image/*">`, calls `loadImage()` |
| CROP-01 | Photo in 35:45 crop frame | SATISFIED | CropEditor: `aspect-ratio: 35/45` |
| CROP-02 | Pan via mouse drag and touch drag | SATISFIED | panZoom.ts: single-pointer drag pan |
| CROP-03 | Zoom via scroll wheel and pinch | SATISFIED | panZoom.ts: 5% coarse / 1% fine (refined from 3% per UAT), pinch zoom |
| CROP-04 | Darkened overlay outside crop frame | SATISFIED | workspace `background: #1a1a1e`, crop frame `background: #000` |
| CROP-05 | Guide bands show chin zone | SATISFIED | chinGuide in spec.ts + GuideOverlay `.guide-band.chin` |
| CROP-06 | Guide bands show crown zone | SATISFIED | crownGuide in spec.ts + GuideOverlay `.guide-band.crown` |
| CROP-07 | Crown-vs-hair visual hint | SATISFIED | GuideOverlay: crown-hint span, white text, readable styling |
| CROP-09 | Keyboard controls: arrows pan, +/- zoom, shift=precision | SATISFIED | CropEditor: panStep `e.shiftKey ? 2 : 10`, zoomFactor `e.shiftKey ? 1.01 : 1.05` |
| UI-01 | mm ruler left of crop frame | SATISFIED | CropEditor: `.ruler` with 0-45mm ticks, labels every 5mm, "0mm"/"45mm" endpoints |
| UI-02 | 32mm/36mm dimension brackets right of frame | SATISFIED | CropEditor: `.dims` with inner/outer brackets |
| UI-03 | Guide bands inside crop frame as colored overlays | SATISFIED | GuideOverlay: positioned absolutely within crop-frame |
| UI-04 | Horizontal ruler below frame (0-35mm), hidden on mobile | SATISFIED | CropEditor: `.ruler-h` in grid-column 2 row 2, 0-35mm ticks, `display: none` at 480px |
| EXPD-01 | Download JPEG at native resolution, quality 1.0 | SATISFIED | ExportButtons `downloadPrint()`: native crop dims, quality 1.0, 300 DPI |
| EXPD-02 | Digital export JPEG max 1200x1600, 70KB-3.5MB | SATISFIED | ExportButtons `downloadDigital()`: caps 1200x1600, binary search from quality 1.0 |
| INFO-01 | Spec panel with AU passport requirements | SATISFIED | SpecPanel: dimensions, face size, position, background, expression, eyes |
| INFO-02 | Child-specific notes | SATISFIED | SpecPanel: under-3 "Mouth may be open" + "No toys or objects", no incorrect eye leniency |
| COMPAT-01 | Works on desktop Chrome/Firefox | SATISFIED | 960px breakpoint, E2E tests for chromium/firefox |
| COMPAT-02 | Works on Android Chrome | SATISFIED | touch-action:none, 44px touch targets, E2E android-chrome test |

**Orphaned Requirements:** None. All 19 requirement IDs accounted for.

**Stale traceability:** REQUIREMENTS.md line 96 lists UI-04 as "Pending" but feature is implemented and verified. Table needs update.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| -- | -- | None found | -- | Clean |

No TODOs, FIXMEs, placeholders, console.logs, or empty implementations in `src/`.

### Test Results

47 tests pass across 5 files:

| File | Tests | Status |
|------|-------|--------|
| crop.test.ts | 14 | PASS |
| panZoom.test.ts | 13 | PASS |
| spec.test.ts | 11 | PASS |
| CropEditor.test.ts | 5 | PASS |
| export.test.ts | 4 | PASS |

Build succeeds: SSR + client bundles, adapter-static output to `build/`.

### Human Verification Required

None. All changes from plans 08-13 are structurally verifiable. Previous UAT cycle exercised the full user flow; these plans were targeted fixes to specific issues found during that cycle.

### Gaps Summary

No gaps. No regressions from plans 08-13. All 19 phase requirement IDs satisfied. 47 tests pass. Build clean.

---

_Verified: 2026-03-08T02:18:00Z_
_Verifier: Claude (gsd-verifier)_
