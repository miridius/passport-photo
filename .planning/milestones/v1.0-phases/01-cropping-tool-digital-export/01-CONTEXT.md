# Phase 1: Cropping Tool + Digital Export - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning (gap closure)

<domain>
## Phase Boundary

User can load a photo, position it within a guided crop frame with chin/crown guide bands, and download correctly-sized cropped photos for passport submission. Covers image loading, pan/zoom interaction, guide overlay, spec reference panel, and two export formats (print-quality native resolution, digital submission capped at 1200x1600).

**Gap closure scope:** 10 UAT issues found after initial build. All fixes are refinements to existing code — no new features.

</domain>

<decisions>
## Implementation Decisions

### Arrow Key Direction
- Press Left = photo slides left (same model as mouse drag: drag left = photo moves left)
- Fix: swap signs on all four arrow key cases in onKeydown

### Modifier Key Semantics
- Shift = coarse everywhere, consistently across all input methods
- Scroll wheel: normal = 1% per step, Shift = 5% per step
- Arrow keys: normal = 2px, Shift = 10px (unchanged)
- +/- keys: normal = 3%, Shift = 10% (unchanged)

### Spec Panel Data
- Show official AU dimension ranges: 35-40mm wide x 45-50mm high
- Make clear that the tool crops to 35x45mm (the smallest valid size)
- Remove eye leniency from child rules — eyes must be open for all ages
- Under-3 relaxation is mouth only (may be open)

### Guide Band Presentation
- Keep blue (crown) and green (chin) as distinct colors
- Crown hint ("top of skull, not hair"): change to white text, increase font to 0.5625rem
- Vertical center line only — no additional reference lines

### Ruler Labels
- Show 0mm and 45mm labels with 'mm' suffix on the vertical ruler
- Interior labels (5, 10, 15, 20, 25, 30, 35, 40) stay as bare numbers
- Add a horizontal ruler below the crop frame (0mm to 35mm), same style as the vertical ruler
- Hide horizontal ruler on mobile (< 480px) along with vertical ruler and dimension brackets

### Keyboard Hint
- Expand hint text to include +/- zoom: "Drag to pan · Scroll to zoom · Arrows to pan · +/- to zoom · Shift for coarse"

### Export Button Placement
- Move export buttons above the crop editor — they must be visible without scrolling
- Crop frame stays at current max-height (80vh)
- Both buttons equally prominent with dimension labels

### Digital Export Quality
- Start at quality 1.0, auto-reduce via binary search if blob exceeds 3.5MB
- If auto-adjustment can't achieve valid file size (source too small for 70KB minimum), block the export and explain why
- No post-export feedback needed beyond browser's download notification

### Responsive Layout
- Raise two-column breakpoint from 768px to 960px
- Single column below 960px
- Hide rulers and dimension brackets on mobile (< 480px) entirely

### Claude's Discretion
- Exact placement of export buttons above the editor (in header bar vs dedicated row)
- Loading skeleton and error state design
- Exact spacing and typography throughout

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `panZoom.ts`: wheelToZoomFactor needs shiftKey parameter — currently no modifier awareness
- `CropEditor.svelte`: onKeydown already has Shift handling for keyboard, just needs sign fix on arrows
- `ExportButtons.svelte`: quality hardcoded at 0.92 in downloadDigital, needs to use auto-adjust loop
- `export.ts`: exportCrop returns a Blob — auto-adjust wraps this with quality iteration

### Established Patterns
- Svelte 5 runes ($state, $derived) for reactivity
- Pure functions extracted for testability (applyPan, applyZoom, computeTransform, calculateSourceRect)
- Normalized crop state (offsetX/Y 0-1, zoomFraction as fraction of source width)
- Component composition: CropEditor contains GuideOverlay, page assembles all components

### Integration Points
- `+page.svelte`: Grid layout with editor-column and spec-column, breakpoint in CSS media query
- `spec.ts`: AU_PASSPORT_SPEC constants consumed by SpecPanel and ExportButtons
- `crop.svelte.ts`: Shared reactive state module imported across components

</code_context>

<specifics>
## Specific Ideas

- Export buttons must be visible without scrolling on laptop screens — current below-editor position fails this
- Digital export quality should be iteratively adjusted (binary search on quality parameter) to land within 70KB-3.5MB
- Ruler/dimensions are precision tools for desktop — hiding them on mobile frees space for the crop frame
- Modifier key consistency is non-negotiable — Shift must mean the same thing for scroll, arrows, and +/- keys

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-cropping-tool-digital-export*
*Context gathered: 2026-03-07 (updated for gap closure)*
