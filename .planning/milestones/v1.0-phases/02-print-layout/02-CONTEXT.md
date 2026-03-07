# Phase 2: Print Layout - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate a print-ready sheet with multiple passport photos tiled for home printing at DM Sofortfoto. Single sheet size (9×13cm, 4 photos). User can preview the layout before downloading.

</domain>

<decisions>
## Implementation Decisions

### Photo sizing
- Crop frame changes from 35×45mm to 36×46mm (within AU spec range of 35-40 × 45-50mm)
- Provides ~0.5mm cutting buffer on all sides
- Rulers stay at 0-35mm and 0-45mm, positioned with 0.5mm inset from each edge
- Guide bands (chin/crown) remain calibrated to the 35×45mm inner zone — positioning workflow unchanged
- The 0.5mm buffer is purely cutting tolerance, invisible to the user

### Sheet layout
- 9×13cm sheet only (standard DM Sofortfoto small format)
- Portrait orientation: 2 columns × 2 rows = 4 photos per sheet
- Photos centered on sheet with equal margins
- 5mm gap between photos

### Cut guides
- Corner (L-shaped) marks at each photo corner, all identical style
- Marks positioned at the 35×45mm inner boundary (0.5mm inset from tile edge), not at the 36×46mm tile edge
- Arms point outward from each photo into the gap/margin
- Mark color: #333333 (dark gray)
- Mark length: 2mm
- Line thickness: 0.6px at 300 DPI
- Marks stay in gap/margin only — never overlap the photo

### Photo resolution
- Native source resolution (1:1 crop from source image), same as existing "Download Print" export
- Each tile rendered at maximum available quality from source
- No downscaling to 413×531 minimum — use full source quality

### Button & workflow
- Third export button alongside existing Print and Digital buttons in the spec column
- "Download Print Sheet" (or similar label)
- Click shows preview of tiled sheet in a modal before downloading
- Confirm to download from preview

### Claude's Discretion
- Preview modal design and dismiss behavior
- Exact button label wording
- Export progress indication
- Canvas rendering strategy for tiling multiple copies

</decisions>

<specifics>
## Specific Ideas

- Cut guide style was validated via interactive playground — user confirmed L-marks at inner boundary with exact values above
- DM Sofortfoto may trim edges, hence the 36×46mm oversize tiles with cut marks at the true 35×45mm boundary
- User has past experience fitting 6 photos on 10×15cm — confirmed 9×13cm (4 photos) is correct scope for this phase

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `export.ts`: `exportCrop()` renders crop region to canvas at specified dimensions — reuse for each tile
- `export.ts`: `calculateSourceRect()` pure function for source rect math — reuse per tile
- `export.ts`: `triggerDownload()` handles blob download — reuse for final sheet
- `changedpi`: Already imported, `changeDpiBlob()` sets JFIF DPI metadata on output JPEG
- `ExportButtons.svelte`: Pattern for export button with loading state and error display

### Established Patterns
- Svelte 5 runes ($state, $derived) for reactivity
- Pure functions extracted for testability
- Normalized crop state (offsetX/Y 0-1, zoomFraction)
- ExportTarget type: { widthPx, heightPx, dpi, format, quality }

### Integration Points
- `crop.svelte.ts`: Shared reactive crop state — print sheet reads same crop as single-photo exports
- `spec.ts`: AU_PASSPORT_SPEC constants — add sheet dimensions (9×13cm, 36×46mm tiles)
- `ExportButtons.svelte`: Add third button here, trigger modal preview
- `+page.svelte`: Modal component rendered at page level

</code_context>

<deferred>
## Deferred Ideas

- 10×15cm sheet with 6 photos (2×3) — save for v3 (EXPP-04 candidate)
- A4 print layout option — already in v2 requirements as EXPP-04

</deferred>

---

*Phase: 02-print-layout*
*Context gathered: 2026-03-08*
