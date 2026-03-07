# Architecture Research

**Domain:** Browser-based image cropping tool (passport photo)
**Researched:** 2026-03-07
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (Svelte)                        │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌──────────┐ │
│  │ PhotoLoad│  │ CropEditor │  │ PrintLayout│  │  Export   │ │
│  └────┬─────┘  └─────┬──────┘  └─────┬─────┘  └────┬─────┘ │
│       │              │               │              │       │
├───────┴──────────────┴───────────────┴──────────────┴───────┤
│                    Canvas Layer (2 canvases)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Image Canvas (photo + transforms)                    │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  Overlay Canvas (guides + mask, pointer-events: none) │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Interaction Layer                         │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ PointerInput │  │  GestureCalc │                         │
│  │ (pan/zoom)   │  │ (pinch/wheel)│                         │
│  └──────────────┘  └──────────────┘                         │
├─────────────────────────────────────────────────────────────┤
│                    State (Svelte stores)                     │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐            │
│  │ imageState│  │ viewState │  │  specConfig  │            │
│  └───────────┘  └───────────┘  └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| PhotoLoad | Accept image file from user (file picker, drag-and-drop) | `<input type="file">` + drag events, creates `Image` object |
| CropEditor | Main workspace: stacked canvases + pointer event handling | Svelte component with `bind:this` for two `<canvas>` elements |
| Overlay | Draw semi-transparent mask with cutout and guide bands | Separate canvas with `pointer-events: none`, redrawn on view change |
| PointerInput | Unified mouse/touch input for pan and zoom | Pointer Events API (`pointerdown`, `pointermove`, `pointerup`) |
| GestureCalc | Compute pan deltas, pinch-zoom scale factor | Pure functions: distance between touches, scale ratio, clamping |
| Export | Crop source image to spec, produce downloadable file | Off-screen canvas + `drawImage` + `toBlob` |
| PrintLayout | Tile cropped photo onto standard paper sizes | Off-screen canvas at paper DPI, grid math for photo placement |
| specConfig | Australian passport photo spec constants | Static data: dimensions, face size ranges, child rules |

## Recommended Project Structure

```
src/
├── routes/
│   └── +page.svelte           # Single-page app, hosts the workflow
├── lib/
│   ├── components/
│   │   ├── PhotoLoader.svelte  # File input + drag-and-drop
│   │   ├── CropEditor.svelte   # Main crop workspace (owns both canvases)
│   │   ├── Overlay.svelte      # Guide overlay rendering (or inlined in CropEditor)
│   │   ├── Toolbar.svelte      # Zoom controls, reset, export buttons
│   │   └── PrintLayout.svelte  # Print sheet preview + download
│   ├── canvas/
│   │   ├── render.ts           # Draw image to canvas with current transform
│   │   ├── overlay.ts          # Draw mask + guide bands
│   │   ├── export.ts           # Crop to spec, toBlob, download trigger
│   │   └── print.ts            # Tile photos onto paper-sized canvas
│   ├── input/
│   │   ├── pointer.ts          # Pointer event handlers (pan, zoom)
│   │   └── gestures.ts         # Pinch distance calc, wheel normalization
│   ├── stores/
│   │   ├── image.ts            # Loaded image, original dimensions
│   │   ├── view.ts             # Pan offset (x, y), zoom scale
│   │   └── spec.ts             # Passport spec constants + derived guide positions
│   └── specs/
│       └── australia.ts        # AU passport photo spec data
└── app.html
```

### Structure Rationale

- **lib/canvas/:** Pure functions that take a `CanvasRenderingContext2D` and state, then draw. No Svelte dependency. Easy to test.
- **lib/input/:** Pointer event handling separated from rendering. Returns deltas/scale factors that update stores, never touches the canvas directly.
- **lib/stores/:** Svelte writable stores. The single source of truth. Components subscribe; canvas functions read.
- **lib/specs/:** Static data, no logic beyond derived values (e.g., guide positions as percentages of photo dimensions). Isolated so adding another country later is trivial (but not in scope now).

## Architectural Patterns

### Pattern 1: Dual-Canvas Stack

**What:** Two `<canvas>` elements stacked via CSS (`position: absolute`). Bottom canvas renders the photo with pan/zoom transforms. Top canvas renders the semi-transparent overlay mask and guide bands, with `pointer-events: none` so all input passes through to the image canvas.

**When to use:** Whenever you have a movable image behind a static (relative to viewport) overlay. Avoids redrawing the overlay on every pan frame -- the overlay only redraws when zoom changes (guide band positions scale).

**Trade-offs:** Slightly more DOM complexity. Large win in rendering performance because pan-only movements skip overlay repaint entirely.

**Example:**
```svelte
<div class="crop-container" style="position: relative; touch-action: none;">
  <canvas bind:this={imageCanvas} style="position: absolute; inset: 0;" />
  <canvas bind:this={overlayCanvas} style="position: absolute; inset: 0; pointer-events: none;" />
</div>
```

### Pattern 2: Pointer Events for Unified Input

**What:** Use the Pointer Events API instead of separate mouse and touch event listeners. One `pointerdown`/`pointermove`/`pointerup` code path handles mouse, touch, and stylus. Multi-touch (pinch zoom) tracked via a `Map<pointerId, {x, y}>`.

**When to use:** Any canvas interaction that must work on both desktop and mobile.

**Trade-offs:** Requires `touch-action: none` on the container to prevent browser default pinch-zoom. Pointer Events are well-supported in all modern browsers (baseline since 2020).

**Example:**
```typescript
const pointers = new Map<number, { x: number; y: number }>();

function onPointerDown(e: PointerEvent) {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
}

function onPointerMove(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId)!;

  if (pointers.size === 1) {
    // Pan: single pointer drag
    updatePan(e.clientX - prev.x, e.clientY - prev.y);
  } else if (pointers.size === 2) {
    // Pinch zoom: compute distance change between two pointers
    updatePinchZoom(pointers);
  }

  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
}

function onPointerUp(e: PointerEvent) {
  pointers.delete(e.pointerId);
}
```

### Pattern 3: Off-Screen Canvas for Export

**What:** When the user exports, create a new off-screen `<canvas>` (or `OffscreenCanvas`) at the exact output pixel dimensions (e.g., 413x531 px for 35x45mm at 300 DPI). Use `drawImage()` with source-rect parameters to extract the correctly positioned/scaled region from the original full-resolution image. Call `toBlob('image/jpeg', 0.95)` and trigger download via a temporary `<a>` element with `URL.createObjectURL`.

**When to use:** Always for export. Never export from the visible on-screen canvas (it's at screen resolution, not print resolution).

**Trade-offs:** Must maintain a mapping between screen coordinates (pan/zoom) and source-image coordinates. This is straightforward linear math but must be correct.

**Example:**
```typescript
function exportCrop(
  sourceImg: HTMLImageElement,
  viewState: { panX: number; panY: number; scale: number },
  spec: { widthPx: number; heightPx: number }
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = spec.widthPx;
  canvas.height = spec.heightPx;
  const ctx = canvas.getContext('2d')!;

  // Map screen crop region back to source image coordinates
  const sx = -viewState.panX / viewState.scale;
  const sy = -viewState.panY / viewState.scale;
  const sw = spec.widthPx / viewState.scale;
  const sh = spec.heightPx / viewState.scale;

  ctx.drawImage(sourceImg, sx, sy, sw, sh, 0, 0, spec.widthPx, spec.heightPx);

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95)
  );
}
```

## Data Flow

### Primary Flow: Photo Load to Export

```
[File Input / Drop]
    ↓ File
[createObjectURL → new Image()] → imageStore (HTMLImageElement, naturalWidth, naturalHeight)
    ↓ triggers
[CropEditor mount] → draw image to imageCanvas at initial fit-to-view scale
    ↓ sets
viewStore (panX=0, panY=0, scale=fitScale)
    ↓ triggers
[Overlay render] → draw mask + guide bands to overlayCanvas
    ↓
[User pans/zooms via pointer events]
    ↓ deltas
viewStore updated (panX, panY, scale)
    ↓ triggers (requestAnimationFrame)
[imageCanvas repaint] + [overlayCanvas repaint if scale changed]
    ↓
[User clicks Export]
    ↓ reads imageStore + viewStore + specStore
[Off-screen canvas drawImage] → toBlob → download
```

### Print Layout Flow

```
[Cropped Blob from export pipeline]
    ↓
[createImageBitmap or new Image()]
    ↓
[Print canvas at paper DPI] (e.g., 1200x1800 px for 4x6" at 300 DPI)
    ↓
[Tile: drawImage in grid pattern with gutters]
    ↓
[toBlob → download]
```

### State Management

```
imageStore ──────────┐
                     ├──→ CropEditor (reads both, renders canvas)
viewStore  ──────────┤
                     ├──→ Overlay (reads viewStore.scale + specStore)
specStore  ──────────┘
     ↑
PointerInput ──→ viewStore (writes pan/zoom deltas)
PhotoLoader  ──→ imageStore (writes loaded image)
```

Stores are Svelte writable stores. Components subscribe reactively. Canvas rendering functions are called inside `$effect` blocks (Svelte 5) or reactive statements that watch store values, throttled via `requestAnimationFrame` to avoid redundant repaints.

### Key Data Flows

1. **Image load:** File -> `URL.createObjectURL` -> `HTMLImageElement` -> store. The original Image object is retained at full resolution for export.
2. **View transform:** Pointer events produce pixel deltas (pan) or scale factors (pinch/wheel). These update `viewStore`. Canvas `translate()` and `scale()` use these values directly.
3. **Guide rendering:** `specStore` provides face-size ranges in mm. Combined with `viewStore.scale` and the known mm-per-pixel ratio, guide band positions are computed in canvas pixel space.
4. **Export:** Reverse the view transform to compute source-image coordinates. Draw the source-rect onto an export-sized off-screen canvas.

## Overlay Rendering Detail

The overlay is the most visually complex component. Approach:

1. Fill entire overlay canvas with `rgba(0, 0, 0, 0.5)` (semi-transparent black).
2. Use `globalCompositeOperation = 'destination-out'` and `fillRect` the crop region to punch a transparent hole -- the photo shows through clearly here.
3. Switch back to `globalCompositeOperation = 'source-over'`.
4. Draw guide bands as semi-transparent colored rectangles within the crop region. These represent the acceptable ranges for chin position, crown position, and face width. Use distinct colors (e.g., green-tinted bands for "face should be in this zone").

This avoids clipping path complexity and the even-odd fill rule. The `destination-out` composite operation is the simplest reliable method for transparent cutouts.

## Coordinate System

Three coordinate spaces are in play. Keeping them straight is the central correctness challenge.

| Space | Origin | Units | Used By |
|-------|--------|-------|---------|
| Screen | top-left of crop container | CSS pixels | Pointer events, DOM layout |
| Canvas | top-left of canvas | device pixels (CSS px * devicePixelRatio) | All drawing operations |
| Image | top-left of source image | source pixels (naturalWidth x naturalHeight) | Export, drawImage source-rect |

**Screen to Canvas:** Multiply by `devicePixelRatio`. Set `canvas.width = container.clientWidth * dpr` and `canvas.style.width = container.clientWidth + 'px'`.

**Canvas to Image:** Divide by `viewState.scale`, subtract `viewState.pan`. This mapping is used at export time.

## Anti-Patterns

### Anti-Pattern 1: Rendering to a Single Canvas

**What people do:** Draw the image, overlay, and guides all on one canvas, every frame.
**Why it's wrong:** The overlay is static relative to the viewport during pan operations. Redrawing it 60fps wastes cycles and causes visual flicker on lower-end mobile devices.
**Do this instead:** Two stacked canvases. Image canvas repaints on pan/zoom. Overlay canvas repaints only on zoom or window resize.

### Anti-Pattern 2: Exporting from the Display Canvas

**What people do:** Call `toBlob` on the visible canvas to produce the output image.
**Why it's wrong:** The display canvas is at screen resolution (e.g., 375px wide on a phone). Passport photos need 300+ DPI (413px wide for 35mm). The output will be blurry or wrong-sized.
**Do this instead:** Always export from a purpose-built off-screen canvas at the exact target pixel dimensions, drawing from the original full-resolution source image.

### Anti-Pattern 3: Separate Mouse and Touch Handlers

**What people do:** Write `mousedown`/`mousemove` handlers and separate `touchstart`/`touchmove` handlers.
**Why it's wrong:** Duplicated logic, edge cases with simultaneous mouse+touch on hybrid devices, more code to maintain.
**Do this instead:** Pointer Events API. One code path, all input devices.

### Anti-Pattern 4: Storing Crop as Pixel Coordinates

**What people do:** Store the crop region as absolute pixel positions on the display canvas.
**Why it's wrong:** Crop position changes meaning when the window resizes or device pixel ratio changes. Export produces wrong results.
**Do this instead:** Store pan/zoom as image-space-relative values (or at minimum, always derive image-space coords at export time from the view transform).

## Suggested Build Order

Dependencies between components dictate the implementation sequence:

```
Phase 1: Canvas foundation
  specs/australia.ts          (no deps, static data)
  stores/image.ts             (no deps)
  stores/view.ts              (no deps)
  stores/spec.ts              (depends on australia.ts)
  canvas/render.ts            (depends on image + view stores)
  CropEditor.svelte           (depends on render.ts + stores)

Phase 2: Overlay + interaction
  canvas/overlay.ts           (depends on view + spec stores)
  input/pointer.ts            (depends on view store)
  input/gestures.ts           (depends on pointer.ts)
  Wire overlay + input into CropEditor

Phase 3: Image loading
  PhotoLoader.svelte          (depends on image store)
  Wire into page

Phase 4: Export
  canvas/export.ts            (depends on image + view + spec stores)
  Download trigger UI

Phase 5: Print layout
  canvas/print.ts             (depends on export.ts output)
  PrintLayout.svelte
```

**Rationale:** Start with the canvas and a hardcoded test image. Get pan/zoom and overlay rendering correct before adding file loading (which is trivial). Export depends on the coordinate math being right, so it comes after the interaction layer is stable. Print layout is purely additive and independent of the core crop flow.

## Sources

- [Pointer Events - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [Using Pointer Events - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events)
- [Canvas Compositing - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing)
- [globalCompositeOperation - MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation)
- [HTMLCanvasElement.toBlob - MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- [Crop an Image with Canvas - PQINA](https://pqina.nl/blog/crop-an-image-with-canvas)
- [Creating an Overlay with a Transparent Cutout - STRICH](https://strich.io/blog/posts/creating-an-overlay-with-transparent-cutout/)
- [Declarative Canvas with Svelte - This Dot Labs](https://www.thisdot.co/blog/declarative-canvas-with-svelte)
- [Australian Passport Office - Photo Requirements](https://www.passports.gov.au/help/passport-photos)
- [touch-action CSS property - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)
- [Downloading Canvas Images with toBlob - DigitalOcean](https://www.digitalocean.com/community/tutorials/js-canvas-toblob)

---
*Architecture research for: browser-based passport photo cropping tool*
*Researched: 2026-03-07*
