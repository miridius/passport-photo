# Project Research Summary

**Project:** PassPhoto
**Domain:** Browser-based image cropping tool (Australian passport photo specifications)
**Researched:** 2026-03-07
**Confidence:** HIGH

## Executive Summary

PassPhoto is a single-purpose, client-side web tool that helps users crop photos to Australian passport specifications (35x45mm, 32-36mm chin-to-crown face size). The recommended approach is a zero-dependency SvelteKit static site using native Canvas and Pointer Events APIs for all image manipulation and interaction. No server, no AI, no accounts -- the entire pipeline (load, position, crop, tile for print) runs in the browser using standard web platform APIs. The only runtime dependency beyond SvelteKit is `changedpi` for setting correct DPI metadata in exported images.

The architecture follows a dual-canvas pattern: an interactive viewport with CSS transforms for smooth pan/zoom, and a hidden off-screen canvas for pixel-accurate export at print resolution. The key differentiator over existing tools is specification-aware guide overlays -- semi-transparent bands showing the acceptable chin and crown zones from the Australian spec, rather than a dumb crop frame. This is the core UX innovation and must be built correctly in Phase 1.

The primary risks are canvas-related: HiDPI resolution handling, iOS Safari memory limits, mobile touch gesture conflicts with browser zoom, and Chromium's JPEG chroma subsampling bug. All have known solutions documented in PITFALLS.md. The critical architectural decision -- storing crop state as normalized coordinates rather than pixel values -- must be made at the start. Getting this wrong requires an expensive refactor. Export as PNG (not JPEG) for the cropped photo avoids the Chromium quality bug entirely.

## Key Findings

### Recommended Stack

Zero runtime dependencies beyond SvelteKit. The image pipeline uses Canvas API, Pointer Events, and `<a download>` -- all native browser APIs. This matches the project's minimal-dependency constraint and is well-suited to a single-purpose tool. The one addition is `changedpi` (tiny header-patching library) for DPI metadata in exports.

**Core technologies:**
- **SvelteKit 2 + Svelte 5:** App framework -- runes (`$state`, `$derived`) fit reactive pan/zoom state naturally; static adapter produces a serverless build
- **Canvas 2D API:** Image rendering, crop extraction, print layout tiling -- ~50 lines of code, no library needed
- **Pointer Events API:** Unified mouse/touch/pen input for pan and pinch-zoom -- ~100 lines, replaces both mouse and touch event handlers
- **changedpi:** DPI metadata patching for exported PNG/JPEG -- essential for correct print sizing
- **bun:** Package manager and runtime (user preference)

### Expected Features

**Must have (table stakes):**
- Load photo from device (file picker + drag-and-drop)
- Pan and zoom with fixed 35:45 crop frame
- Semi-transparent guide overlay showing chin/crown acceptable zones
- Download cropped photo at 300 DPI (413x531 px minimum)
- Works on mobile browsers (primary use case: phone photos)
- Works on desktop browsers

**Should have (differentiators):**
- Print layout generator (4x6 and A4 tiling with cut guides)
- "Crown vs hair" visual hint (addresses #1 rejection cause)
- Spec reference panel (builds user trust)

**Defer:**
- Real-time mm measurement readout -- only if guides prove confusing
- Child mode toggle -- face size specs are identical; expression rules belong in a text note, not a mode
- Undo/redo, keyboard shortcuts -- add after core flow works
- PDF export (jsPDF) -- JPEG print sheets work at home/kiosk; add only if needed
- Multi-country support -- hard-code Australian specs

### Architecture Approach

Single-page SvelteKit app with a layered canvas architecture. All state in Svelte writable stores (image, view transform, spec constants). Canvas rendering via pure functions that take a context and state -- no Svelte coupling in the drawing layer. Interaction handled by a Svelte action (`use:panZoom`) that updates stores.

**Major components:**
1. **PhotoLoader** -- file input + drag-and-drop, writes to imageStore
2. **CropEditor** -- dual-canvas workspace (image canvas + overlay canvas), reads all stores
3. **Overlay** -- semi-transparent mask with guide bands, redraws only on zoom change
4. **Export** -- off-screen canvas at print resolution, coordinate mapping from view to source image
5. **PrintLayout** -- tiles cropped photo onto paper-sized canvas with gutters and cut marks

### Critical Pitfalls

1. **Canvas HiDPI resolution** -- Display canvas must use `devicePixelRatio` scaling; export canvas must be fixed at print pixel dimensions (413x531). Getting this wrong produces blurry exports. Address in Phase 1.
2. **EXIF orientation double-rotation** -- Do NOT use an EXIF rotation library. Modern browsers auto-rotate via `image-orientation: from-image`. Manual rotation causes double-rotation. Test with real phone photos in Phase 1.
3. **Mobile touch gesture conflicts** -- Set `touch-action: none` on the crop area to prevent browser pinch-zoom. Use Pointer Events, not Touch Events. Must test on real iOS/Android devices in Phase 2.
4. **Chromium JPEG quality loss** -- Chromium applies aggressive chroma subsampling at any JPEG quality below 1.0. Export cropped photos as PNG to avoid entirely. Use JPEG 1.0 only for larger print layout sheets.
5. **iOS Safari canvas memory limits** -- Downscale source images at load time. Clean up canvases (resize to 1x1) on component destroy. Silent failure makes this hard to debug if missed.
6. **DPI metadata missing from exports** -- Canvas `toBlob()` always writes 96 DPI. Use `changedpi` to patch to 300 DPI, otherwise prints come out at wrong physical size.

## Implications for Roadmap

### Phase 1: Canvas Foundation + Image Loading

**Rationale:** Everything depends on the canvas setup and coordinate system being correct. Architectural mistakes here (pixel coordinates, wrong DPI, missing HiDPI scaling) are expensive to fix later. Start with a hardcoded test image to validate the canvas pipeline before adding file loading UI.

**Delivers:** SvelteKit project scaffold, spec constants, store architecture, canvas rendering with correct HiDPI scaling, image loading with EXIF orientation verification, normalized coordinate system for crop state.

**Features:** Load photo from device, fixed 35:45 crop frame display.

**Pitfalls addressed:** Canvas resolution vs display size, EXIF double-rotation, crop state as normalized coordinates, iOS canvas memory (downscale at load).

### Phase 2: Interaction + Guide Overlay

**Rationale:** Pan/zoom interaction is the core UX. The guide overlay is the key differentiator. These must work together -- guides reposition based on zoom level. Touch gesture handling must be tested on real mobile devices.

**Delivers:** Pan/zoom via Pointer Events (mouse + touch + pinch), semi-transparent overlay with chin/crown guide bands, zoom clamping (min: no empty space; max: DPI floor).

**Features:** Pan and zoom interaction, guide overlay with acceptable zones, mobile browser support.

**Pitfalls addressed:** Touch gesture conflicts with browser zoom, overlay opacity for face visibility.

### Phase 3: Export Pipeline

**Rationale:** Export depends on correct coordinate math from Phase 1-2. Off-screen canvas maps view transform back to source image coordinates. DPI metadata and format choice (PNG vs JPEG) are decided here.

**Delivers:** Cropped photo download at 300 DPI as PNG, correct pixel dimensions (413x531), DPI metadata via `changedpi`, download trigger UX.

**Features:** Download cropped photo at correct resolution.

**Pitfalls addressed:** Chromium JPEG chroma subsampling (use PNG), DPI metadata missing from exports.

### Phase 4: Print Layout + Polish

**Rationale:** Print layout is additive -- it takes the exported crop and tiles it. No new architectural patterns needed. Polish items (crown hint, spec panel) are decorations on the existing overlay.

**Delivers:** 4x6 and A4 print sheet generation with cut guides, crown-vs-hair hint on overlay, spec reference panel.

**Features:** Print layout generator, crown/hair visual hint, spec reference panel.

**Pitfalls addressed:** Print layout sizing (physical measurement verification needed).

### Phase Ordering Rationale

- **Dependency chain:** Canvas setup -> interaction -> export -> print layout. Each phase requires the previous one to be stable.
- **Risk front-loading:** The hardest bugs (HiDPI, coordinate systems, iOS memory) are in Phase 1-2. Catching them early avoids rework.
- **Incremental delivery:** After Phase 3, the tool is fully usable for its core purpose (crop and download). Phase 4 is enhancement.
- **Architecture grouping:** Phases 1-2 establish all stores and the canvas layer. Phase 3 adds the export pipeline. Phase 4 is purely additive features.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Mobile gesture handling is tricky to get right. Test matrix (iOS Safari, Android Chrome, various DPR values) should be defined during planning. Desktop emulation is insufficient.
- **Phase 3:** The `changedpi` library API and integration pattern should be verified during phase planning. Confirm it supports PNG pHYs chunk patching.

Phases with standard patterns (skip research-phase):
- **Phase 1:** SvelteKit scaffold, Canvas 2D drawing, file input -- all well-documented with established patterns.
- **Phase 4:** Print layout is straightforward canvas tiling math. The overlay hint and spec panel are simple UI additions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero-dependency approach with native APIs is well-proven. SvelteKit + Canvas is a standard combination. |
| Features | HIGH | Australian passport specs sourced from official government documents. Feature prioritization based on competitive analysis. |
| Architecture | HIGH | Dual-canvas pattern, Pointer Events, off-screen export canvas are all documented MDN patterns with code examples. |
| Pitfalls | HIGH | All pitfalls verified via MDN specs, browser bug trackers (Chromium #972180), and WHATWG discussions. Recovery strategies are low-cost. |

**Overall confidence:** HIGH

### Gaps to Address

- **changedpi compatibility:** Verify the library works with current bundler setup (Vite/bun) and supports both PNG and JPEG DPI patching. Small risk -- the library is simple and maintained by Shutterstock.
- **iOS Safari canvas limits on older devices:** iOS 18+ raised the limit significantly, but if supporting iOS 16-17, the 16M pixel limit applies. Decide minimum iOS version during planning.
- **Print accuracy verification:** The 35x45mm physical print size can only be verified by actually printing. Plan a physical test during Phase 4.
- **Viewport meta tag on iOS:** The interaction between `touch-action: none`, `user-scalable=no` (ignored by iOS), and `gesturestart` prevention needs real-device testing. Document the exact meta tag configuration during Phase 2 planning.

## Sources

### Primary (HIGH confidence)
- [Australian Passport Office - Passport Photos](https://www.passports.gov.au/help/passport-photos) -- official spec: 35x45mm, 32-36mm face height
- [Australian Passport Office - Camera Operator Guidelines 2025 (PDF)](https://www.passports.gov.au/sites/default/files/2024-12/CameraOperatorGuide_A4-2025_1.pdf) -- detailed positioning requirements
- [MDN: Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) -- unified input API
- [MDN: Canvas toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) -- export API
- [MDN: devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) -- HiDPI handling
- [MDN: touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) -- gesture conflict prevention
- [Chromium Bug #972180](https://bugs.chromium.org/p/chromium/issues/detail?id=972180) -- JPEG chroma subsampling at quality < 1.0

### Secondary (MEDIUM confidence)
- [changeDPI library (Shutterstock)](https://github.com/shutterstock/changeDPI) -- DPI metadata patching
- [PQINA: Canvas area limits](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/) -- iOS Safari canvas constraints
- [jsPDF](https://www.npmjs.com/package/jspdf) -- deferred PDF export option

---
*Research completed: 2026-03-07*
*Ready for roadmap: yes*
