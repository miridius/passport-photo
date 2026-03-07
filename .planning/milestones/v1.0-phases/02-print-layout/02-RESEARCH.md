# Phase 02: Print Layout - Research

**Researched:** 2026-03-08
**Domain:** Canvas compositing, print-ready image generation, DPI metadata
**Confidence:** HIGH

## Summary

Phase 2 generates a print-ready JPEG sheet (9x13cm at 300 DPI) with 4 passport photos in a 2x2 grid, L-shaped cut marks, and a preview modal before download. The entire pipeline uses browser-native Canvas API -- no new dependencies needed. The existing `export.ts` module provides `calculateSourceRect()` for crop math, `exportCrop()` as a reference pattern, and `changeDpiBlob()` for DPI metadata. The new work is: (1) a pure-function layout calculator, (2) a canvas compositing function that tiles 4 copies of the crop with cut guides, and (3) a preview modal using the native `<dialog>` element.

**Primary recommendation:** Build print sheet generation as pure functions in a new `src/lib/canvas/printSheet.ts` module, with all layout math testable without DOM. The preview modal is a lightweight Svelte component wrapping `<dialog>`. No new npm dependencies.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Crop frame changes from 35x45mm to 36x46mm (0.5mm cutting buffer on all sides)
- Rulers stay at 0-35mm and 0-45mm, positioned with 0.5mm inset from each edge
- Guide bands remain calibrated to 35x45mm inner zone
- 9x13cm sheet only (standard DM Sofortfoto small format)
- Portrait orientation: 2 columns x 2 rows = 4 photos per sheet
- Photos centered on sheet with equal margins
- 5mm gap between photos
- Corner (L-shaped) marks at each photo corner, all identical style
- Marks positioned at 35x45mm inner boundary (0.5mm inset from tile edge)
- Arms point outward from each photo into gap/margin
- Mark color: #333333 (dark gray)
- Mark length: 2mm
- Line thickness: 0.6px at 300 DPI
- Marks stay in gap/margin only -- never overlap the photo
- Native source resolution (1:1 crop from source image)
- Third export button alongside existing Print and Digital buttons
- Click shows preview of tiled sheet in a modal before downloading

### Claude's Discretion
- Preview modal design and dismiss behavior
- Exact button label wording
- Export progress indication
- Canvas rendering strategy for tiling multiple copies

### Deferred Ideas (OUT OF SCOPE)
- 10x15cm sheet with 6 photos (2x3) -- save for v3
- A4 print layout option -- already in v2 requirements as EXPP-04

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPP-01 | Generate print layout tiling cropped photo onto 9x13cm sheet (4 photos, 2x2) | Layout math pure functions, canvas compositing pattern, native resolution strategy |
| EXPP-02 | Print layout includes cut guides showing where to cut individual photos | L-shaped corner mark rendering via Canvas lineTo, positioning math at 35x45mm inner boundary |
| EXPP-03 | Downloadable as JPEG at 300 DPI with correct DPI metadata | Existing `changeDpiBlob()` from changedpi package, `canvas.toBlob('image/jpeg', 1.0)` |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Canvas API | Browser native | Compositing tiles, drawing cut marks | Zero-dependency, hardware-accelerated drawImage, already used in export.ts |
| changedpi | ^1.0.4 | JFIF DPI metadata on output JPEG | Already imported, `changeDpiBlob()` modifies headers without touching pixel data |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `<dialog>` element | Browser native | Preview modal | Built-in backdrop, Esc dismiss, focus trap, no library needed |
| Svelte 5 runes | ^5.20.0 | Reactive state for modal open/close, export progress | Existing pattern in ExportButtons.svelte |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canvas API | OffscreenCanvas | Better perf but unnecessary for 4 tiles; not needed |
| `<dialog>` | Custom modal div | Loses free accessibility, focus trap, Esc handling |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/
  canvas/
    export.ts            # existing — single-photo export
    printSheet.ts         # NEW — layout math + sheet compositing
    printSheet.test.ts    # NEW — unit tests for layout math
  components/
    ExportButtons.svelte  # MODIFIED — add print sheet button
    PrintPreview.svelte   # NEW — preview modal with dialog element
  state/
    spec.ts              # MODIFIED — add sheet/tile constants
```

### Pattern 1: Pure Layout Calculator
**What:** All mm-to-pixel math, tile positions, and margin calculations as pure functions.
**When to use:** Always -- this is the core of the phase.
**Example:**
```typescript
// All dimensions in mm, converted to pixels via scale factor
export interface SheetLayout {
  sheetWidthPx: number;
  sheetHeightPx: number;
  tiles: TilePosition[];
  pxPerMm: number;
}

export interface TilePosition {
  // Top-left corner of 36x46mm tile area on sheet canvas
  tileX: number;
  tileY: number;
  // Top-left corner of 35x45mm photo within tile (0.5mm inset)
  photoX: number;
  photoY: number;
  photoWidthPx: number;
  photoHeightPx: number;
}

export function calculateSheetLayout(cropWidthPx: number): SheetLayout {
  const pxPerMm = cropWidthPx / 35; // scale from photo width, not tile
  // ... compute all positions using pxPerMm
}
```

### Pattern 2: Canvas Compositing (Draw Once, Tile Four)
**What:** Render the source crop to a temporary canvas once, then drawImage four times onto the sheet canvas.
**When to use:** For the print sheet generation function.
**Example:**
```typescript
export async function renderPrintSheet(
  img: HTMLImageElement,
  crop: CropState,
  layout: SheetLayout,
): Promise<Blob> {
  // 1. Create sheet canvas (white background)
  // 2. Render source crop to temp canvas at native resolution
  // 3. drawImage temp canvas 4x at tile positions
  // 4. Draw cut marks
  // 5. toBlob + changeDpiBlob
}
```

### Pattern 3: Native `<dialog>` Modal
**What:** Preview modal using HTML `<dialog>` element with `showModal()`.
**When to use:** For the print sheet preview before download.
**Example:**
```svelte
<dialog bind:this={dialogEl} onclose={handleClose}>
  <img src={previewUrl} alt="Print sheet preview" />
  <div class="actions">
    <button onclick={handleDownload}>Download</button>
    <button onclick={() => dialogEl?.close()}>Cancel</button>
  </div>
</dialog>
```
**Key behaviors:**
- `showModal()` adds backdrop, traps focus, enables Esc dismiss
- Backdrop click to close: check `event.target === dialog` in click handler
- `::backdrop` pseudo-element for dimming overlay
- Call `URL.revokeObjectURL(previewUrl)` on close to free memory

### Pattern 4: Crop Frame Resize (35x45mm to 36x46mm)
**What:** The crop frame aspect ratio changes from 35:45 to 36:46 to include the 0.5mm cutting buffer.
**When to use:** This affects the CropEditor component.
**Key insight:** The rulers stay at 0-35mm / 0-45mm but are positioned 0.5mm from the edge. Guide bands stay calibrated to 35x45mm. Only the frame's aspect-ratio CSS and the export source rect math change.

### Anti-Patterns to Avoid
- **Scaling source pixels down to 300 DPI:** The user explicitly chose native resolution. Use source crop pixels as-is, let the physical DPI be whatever the source provides.
- **Drawing each tile from source independently:** Render the crop once to a temp canvas, then composite 4x. Avoids 4x the decoding work.
- **Putting layout constants in the component:** All mm dimensions belong in spec.ts, all layout math in printSheet.ts. Components only consume computed positions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JPEG DPI metadata | Manual JFIF header manipulation | `changeDpiBlob()` from changedpi | Already imported, handles JFIF/EXIF byte-level editing correctly |
| Modal dialog | Custom overlay div with z-index | Native `<dialog>` with `showModal()` | Free focus trap, Esc dismiss, backdrop, accessibility |
| Image download trigger | Custom fetch/save logic | `triggerDownload()` from export.ts | Already handles createObjectURL, `<a download>`, cleanup |
| Source rect math | New crop calculation | `calculateSourceRect()` from export.ts | Already correct, pure, tested |

**Key insight:** The existing export.ts has the building blocks. The new code is orchestration (tiling + cut marks), not reimplementation.

## Common Pitfalls

### Pitfall 1: Aspect Ratio Mismatch Between Photo and Tile
**What goes wrong:** Drawing a 35:45 crop stretched into a 36:46 tile distorts the image.
**Why it happens:** The tile (36x46mm) has a different aspect ratio than the photo (35x45mm). 35/45 = 0.7778, 36/46 = 0.7826.
**How to avoid:** Fill tile area with white, draw photo at 35x45mm centered with 0.5mm inset. The 0.5mm border is the cutting buffer.
**Warning signs:** Photos look subtly wider or shorter than single-photo export.

### Pitfall 2: Scale Factor Based on Wrong Dimension
**What goes wrong:** Using tile width (36mm) instead of photo width (35mm) as the scale base produces slightly wrong resolution.
**Why it happens:** The "native resolution" crop is W pixels wide covering 35mm of physical space, not 36mm.
**How to avoid:** `pxPerMm = cropWidthPx / 35` (photo width), then derive tile/sheet dimensions from that scale.
**Warning signs:** Photos are slightly smaller or larger than expected on the printed sheet.

### Pitfall 3: Cut Mark Arms Overlapping Photo
**What goes wrong:** L-shaped mark arms drawn inward from the corner overlap the photo content.
**Why it happens:** Arms should point outward (into the gap/margin), not inward.
**How to avoid:** For top-left corner, horizontal arm goes left, vertical arm goes up. Each arm radiates away from the photo center.
**Warning signs:** Visible marks on top of the photo when printed.

### Pitfall 4: Memory Leak from Preview URL
**What goes wrong:** Each preview creates an object URL that isn't revoked.
**Why it happens:** `URL.createObjectURL()` allocates memory that persists until revoked or page unloads.
**How to avoid:** Call `URL.revokeObjectURL(previewUrl)` when the modal closes (in `onclose` handler).
**Warning signs:** Memory grows with repeated preview opens.

### Pitfall 5: Canvas toBlob with Wrong MIME Type
**What goes wrong:** Output is PNG instead of JPEG, or quality parameter is ignored.
**Why it happens:** `toBlob()` defaults to `image/png` if MIME type is omitted. Quality parameter only applies to lossy formats.
**How to avoid:** Always pass `'image/jpeg'` and quality explicitly: `canvas.toBlob(cb, 'image/jpeg', 1.0)`.
**Warning signs:** Output file is much larger than expected (PNG) or quality parameter has no effect.

### Pitfall 6: Crop Frame Aspect Ratio Change Breaks Guide Bands
**What goes wrong:** Changing crop frame from 35:45 to 36:46 moves the guide bands if they're positioned as fractions of frame height.
**Why it happens:** Guide bands are calibrated to 35x45mm space. In a 36x46mm frame, 0.5mm is above and below the 35x45 zone.
**How to avoid:** Guide band fractions must be recalculated: `(0.5 + originalMm) / 46` instead of `originalMm / 45`. Rulers also need 0.5mm offset.
**Warning signs:** Crown/chin guides are slightly off from where they should be.

## Code Examples

### Layout Calculation (Pure Function)
```typescript
// Source: derived from project spec.ts pattern
const SHEET_WIDTH_MM = 90;
const SHEET_HEIGHT_MM = 130;
const TILE_WIDTH_MM = 36;
const TILE_HEIGHT_MM = 46;
const PHOTO_WIDTH_MM = 35;
const PHOTO_HEIGHT_MM = 45;
const GAP_MM = 5;
const INSET_MM = 0.5;
const COLS = 2;
const ROWS = 2;

export function calculateSheetLayout(cropWidthPx: number): SheetLayout {
  const pxPerMm = cropWidthPx / PHOTO_WIDTH_MM;

  const totalTileW = COLS * TILE_WIDTH_MM + (COLS - 1) * GAP_MM;
  const totalTileH = ROWS * TILE_HEIGHT_MM + (ROWS - 1) * GAP_MM;
  const marginX = (SHEET_WIDTH_MM - totalTileW) / 2;
  const marginY = (SHEET_HEIGHT_MM - totalTileH) / 2;

  const tiles: TilePosition[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tileXmm = marginX + col * (TILE_WIDTH_MM + GAP_MM);
      const tileYmm = marginY + row * (TILE_HEIGHT_MM + GAP_MM);
      tiles.push({
        tileX: Math.round(tileXmm * pxPerMm),
        tileY: Math.round(tileYmm * pxPerMm),
        photoX: Math.round((tileXmm + INSET_MM) * pxPerMm),
        photoY: Math.round((tileYmm + INSET_MM) * pxPerMm),
        photoWidthPx: Math.round(PHOTO_WIDTH_MM * pxPerMm),
        photoHeightPx: Math.round(PHOTO_HEIGHT_MM * pxPerMm),
      });
    }
  }

  return {
    sheetWidthPx: Math.round(SHEET_WIDTH_MM * pxPerMm),
    sheetHeightPx: Math.round(SHEET_HEIGHT_MM * pxPerMm),
    tiles,
    pxPerMm,
  };
}
```

### Cut Mark Drawing (Canvas)
```typescript
// Source: derived from Canvas API lineTo pattern
const CUT_MARK_LENGTH_MM = 2;
const CUT_MARK_COLOR = '#333333';
const CUT_MARK_LINE_WIDTH = 0.6; // px at 300 DPI, scales with resolution

export function drawCutMarks(
  ctx: CanvasRenderingContext2D,
  tile: TilePosition,
  pxPerMm: number,
): void {
  const armLen = CUT_MARK_LENGTH_MM * pxPerMm;
  const lineWidth = CUT_MARK_LINE_WIDTH * (pxPerMm / (300 / 25.4));

  ctx.strokeStyle = CUT_MARK_COLOR;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'square';

  // Inner boundary corners (photo edges)
  const left = tile.photoX;
  const right = tile.photoX + tile.photoWidthPx;
  const top = tile.photoY;
  const bottom = tile.photoY + tile.photoHeightPx;

  // Top-left: arms go left and up
  drawLMark(ctx, left, top, -armLen, -armLen);
  // Top-right: arms go right and up
  drawLMark(ctx, right, top, armLen, -armLen);
  // Bottom-left: arms go left and down
  drawLMark(ctx, left, bottom, -armLen, armLen);
  // Bottom-right: arms go right and down
  drawLMark(ctx, right, bottom, armLen, armLen);
}

function drawLMark(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  dx: number, dy: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + dx, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dy);
  ctx.stroke();
}
```

### Preview Modal (Svelte 5)
```svelte
<!-- Source: HTML dialog element MDN + Svelte 5 runes -->
<script lang="ts">
  let dialogEl: HTMLDialogElement | undefined = $state();
  let previewUrl: string = $state('');

  export function show(blob: Blob) {
    previewUrl = URL.createObjectURL(blob);
    dialogEl?.showModal();
  }

  function handleClose() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialogEl) dialogEl.close();
  }
</script>

<dialog bind:this={dialogEl} onclose={handleClose} onclick={handleBackdropClick}>
  {#if previewUrl}
    <img src={previewUrl} alt="Print sheet preview" />
  {/if}
  <div class="actions">
    <button onclick={handleDownload}>Download</button>
    <button onclick={() => dialogEl?.close()}>Cancel</button>
  </div>
</dialog>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modal div + z-index | Native `<dialog>` + `showModal()` | 2022+ | Free accessibility, focus trap, Esc dismiss, backdrop |
| `toDataURL()` for export | `toBlob()` for export | Long-standing | Better memory efficiency, async, no base64 overhead |
| Manual DPI header editing | changedpi library | Already in use | Handles JFIF/EXIF correctly |

**Deprecated/outdated:**
- `toDataURL()`: Still works but `toBlob()` is preferred for large images (no base64 encoding overhead)

## Open Questions

1. **Crop frame resize timing**
   - What we know: The crop frame must change from 35:45 to 36:46 aspect ratio, with rulers offset by 0.5mm
   - What's unclear: Should this happen as the first task (since it affects Phase 1 UI) or as part of the print sheet work?
   - Recommendation: First task -- it's a prerequisite for accurate print sheets and affects existing components

2. **Preview image sizing**
   - What we know: The full-resolution sheet could be very large (5000+ pixels wide)
   - What's unclear: Whether to generate a lower-res preview and full-res for download, or use the same image for both
   - Recommendation: Generate full resolution, display with CSS `max-width: 100%` in the modal. The blob is needed for download anyway, and generating twice wastes time.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (unit), Playwright 1.58.x (E2E) |
| Config file | vite.config implied (Vitest), playwright.config.ts |
| Quick run command | `bun vitest run src/lib/canvas/printSheet.test.ts` |
| Full suite command | `bun vitest run && bun test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPP-01 | Layout math: 4 tiles positioned correctly on 9x13 sheet | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | Wave 0 |
| EXPP-01 | Sheet canvas dimensions match native resolution | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | Wave 0 |
| EXPP-02 | Cut marks at correct positions (35x45mm inner boundary) | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | Wave 0 |
| EXPP-02 | Cut mark arms point outward, never overlap photo | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | Wave 0 |
| EXPP-03 | Output is JPEG with 300 DPI metadata | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | Wave 0 |
| EXPP-01 | Print sheet button appears, triggers preview modal | E2E | `bun test:e2e` | Wave 0 |
| EXPP-01 | Preview modal shows sheet image, download button works | E2E | `bun test:e2e` | Wave 0 |
| -- | Crop frame aspect ratio changed to 36:46 | unit | `bun vitest run src/lib/state/spec.test.ts` | Existing (needs update) |
| -- | Guide bands correct in 36:46 frame | unit | `bun vitest run src/lib/state/spec.test.ts` | Existing (needs update) |

### Sampling Rate
- **Per task commit:** `bun vitest run`
- **Per wave merge:** `bun vitest run && bun test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/canvas/printSheet.test.ts` -- covers EXPP-01/02/03 layout math and cut mark positioning
- [ ] E2E test additions in `e2e/passphoto.test.ts` -- covers print sheet button, preview modal, download flow
- [ ] Update `src/lib/state/spec.test.ts` -- covers new sheet constants and 36x46mm crop frame

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/canvas/export.ts` -- verified calculateSourceRect, exportCrop, triggerDownload patterns
- Existing codebase: `src/lib/state/spec.ts` -- verified AU_PASSPORT_SPEC constants and structure
- Existing codebase: `src/lib/components/ExportButtons.svelte` -- verified button/export pattern
- [MDN Canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) -- JPEG quality, MIME type
- [MDN dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) -- showModal, backdrop, close behavior
- [changedpi GitHub](https://github.com/shutterstock/changeDPI) -- changeDpiBlob API for JPEG DPI metadata

### Secondary (MEDIUM confidence)
- [MDN Canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) -- drawImage from canvas-to-canvas is hardware accelerated
- [Canvas max size](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/) -- Chrome: 32767px max dimension, 268M max area

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all existing tools verified in codebase
- Architecture: HIGH -- follows established export.ts pattern, pure function approach matches project convention
- Pitfalls: HIGH -- aspect ratio mismatch and scale factor base verified with explicit calculations
- Layout math: HIGH -- all dimensions verified computationally (margins, tile positions, cut mark positions)

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, no fast-moving dependencies)
