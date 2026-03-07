# Phase 1: Cropping Tool + Digital Export - Research

**Researched:** 2026-03-07
**Domain:** Browser-based image cropping with canvas export (SvelteKit + Svelte 5)
**Confidence:** HIGH

## Summary

Phase 1 builds the entire interactive cropping tool from a green-field SvelteKit project through to downloadable passport photos. The tech stack is locked: SvelteKit with Svelte 5 runes, native Canvas API for export, Pointer Events for gestures, and `changedpi` as the sole runtime dependency beyond SvelteKit itself. No project scaffolding exists yet -- Phase 1 must create it.

The core technical challenge is the coordinate system: the user interacts in screen space (CSS pixels), the display renders with `devicePixelRatio` scaling, and export must map back to source-image coordinates at exact pixel dimensions (413x531 for print, 1200x1600 for digital). Storing crop state as normalized coordinates (0-1 relative to source image) is the decision that makes everything else work.

**Primary recommendation:** Use CSS transforms on an `<img>` element for the interactive viewport (GPU-accelerated, simple), HTML/CSS overlay for guides (no canvas needed for display), and off-screen canvas only for export. This is simpler than a dual-canvas display approach and keeps overlay elements as DOM nodes (easier to style, label, and make accessible).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOAD-01 | User can load a photo from their device via file picker | File input with `accept="image/*"`, `URL.createObjectURL`, no EXIF handling needed (browsers auto-rotate since 2020) |
| CROP-01 | Photo displays within a fixed 35:45 aspect ratio crop frame | CSS aspect-ratio container with overflow hidden; image positioned via CSS transform |
| CROP-02 | Pan via mouse drag and touch drag | Pointer Events API (`pointerdown`/`pointermove`/`pointerup`) as Svelte action |
| CROP-03 | Zoom via scroll wheel and pinch zoom | Wheel event for scroll, two-pointer distance tracking for pinch; `touch-action: none` on crop area |
| CROP-04 | Semi-transparent overlay darkens area outside crop frame | CSS overlay with transparent cutout (simpler than canvas composite operations) |
| CROP-05 | Guide bands for acceptable chin zone | HTML elements positioned as percentage of crop frame height; chin zone at ~12-19% from bottom |
| CROP-06 | Guide bands for acceptable crown zone | Crown zone at ~83-99% from bottom; same positioning approach as chin |
| CROP-07 | Crown-vs-hair visual hint | Text label or icon annotation on the crown guide band |
| EXPD-01 | Download cropped photo at native source resolution (1:1 crop, quality 1.0) | Off-screen canvas at native crop dimensions + `drawImage` source-rect + `toBlob('image/jpeg', 1.0)` + `changedpi` for 300 DPI metadata. 413x531 at 300 DPI is the minimum acceptable output. |
| EXPD-02 | Download at digital submission specs (max 1200x1600 px, never upscale, quality 0.92) | Off-screen canvas capped at 1200x1600 + `toBlob('image/jpeg', 0.92)` + `changedpi`. Quality 0.92 targets 70KB-3.5MB file size range. |
| INFO-01 | Spec reference panel with Australian requirements | Static data component showing dimensions, face size range, position rules |
| INFO-02 | Child-specific notes visible | Include in spec panel: under-3 mouth may be open, expression leniency for infants |
| COMPAT-01 | Works on desktop Chrome and Firefox | Standard web APIs, no vendor-specific features |
| COMPAT-02 | Works on Android Chrome | `touch-action: none` on crop area, Pointer Events, responsive layout |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | ^2.53 | App framework + static site generation | User preference. `adapter-static` produces standalone HTML/JS/CSS. |
| Svelte | ^5.53 | UI framework | Runes (`$state`, `$derived`, `$effect`) for reactive crop state. Compiled output = tiny bundle. |
| TypeScript | ^5.5 | Type safety | Crop coordinates, spec dimensions, and export math all benefit from typed interfaces. |
| changedpi | ^1.0.4 | DPI metadata in exported images | Canvas `toBlob` always embeds 72/96 DPI. This library patches PNG pHYs / JPEG JFIF headers to 300 DPI without re-encoding. Only runtime dependency. |

### Dev Tooling
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sveltejs/adapter-static | latest | Static site generation | Always -- no server needed |
| Vite | ^6.x | Build tool | Ships with SvelteKit |
| Vitest | latest | Unit testing | Pure function tests for coordinate math, spec calculations, export logic |
| Prettier + prettier-plugin-svelte | latest | Formatting | Standard Svelte ecosystem |
| ESLint + eslint-plugin-svelte | latest | Linting | Standard Svelte ecosystem |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS transform viewport | Dual-canvas display | Two canvases add complexity; CSS transforms are GPU-accelerated and let overlay be HTML/CSS |
| Native Pointer Events | svelte-gestures | Library adds abstraction over a simple API (pan + pinch only) |
| changedpi | dpi-tools | Fork of changedpi with Rollup build; changedpi is battle-tested (Shutterstock), MIT licensed |
| HTML/CSS overlay | Canvas composite overlay | Canvas overlay needs `destination-out` compositing; HTML overlay is simpler to label and style |

### Installation

```bash
# Scaffold project
bunx sv create passphoto
# Select: SvelteKit minimal, TypeScript, Prettier, ESLint
# Package manager: bun

# Add static adapter
bun add -D @sveltejs/adapter-static

# Add the sole runtime dependency
bun add changedpi

# Add vitest (if not selected during sv create)
bunx sv add vitest
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  routes/
    +page.svelte              # Single-page app, hosts workflow
    +layout.js                # export const prerender = true (for adapter-static)
  lib/
    components/
      PhotoLoader.svelte      # File input, creates Image object
      CropEditor.svelte       # Main workspace: image + overlay + pointer handling
      GuideOverlay.svelte     # Chin/crown guide bands as positioned HTML elements
      SpecPanel.svelte         # Australian spec reference + child notes
      ExportButtons.svelte    # Download buttons for print and digital formats
    actions/
      panZoom.ts              # Svelte action: attaches Pointer Event listeners, updates state
    canvas/
      export.ts               # Off-screen canvas crop + toBlob + changedpi
    state/
      crop.svelte.ts          # $state for pan/zoom/image; normalized coordinates
      spec.ts                 # Australian passport spec constants + derived guide positions
    types.ts                  # CropState, ExportSpec, GuidePosition interfaces
  app.html
static/
svelte.config.js              # adapter-static
vite.config.ts                # vitest config
```

### Pattern 1: CSS Transform Viewport + HTML Overlay

**What:** The crop editor uses an `<img>` element with CSS `transform: translate(Xpx, Ypx) scale(S)` for pan/zoom. The overlay (darkened area, guide bands) is pure HTML/CSS positioned over the image. Only the export path uses a `<canvas>`.

**When to use:** Always for the interactive display. Simpler than canvas, GPU-accelerated, and overlays are regular DOM elements (accessible, labelable).

**Example:**
```svelte
<div class="crop-frame" style="aspect-ratio: 35/45; overflow: hidden; position: relative;">
  <img
    src={imageUrl}
    alt="Photo to crop"
    style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: 0 0;"
    draggable="false"
  />
  <GuideOverlay />
</div>
```

### Pattern 2: Svelte Action for Pointer Events

**What:** A `use:panZoom` action attaches `pointerdown`/`pointermove`/`pointerup` listeners to the crop container. Tracks active pointers in a `Map<pointerId, {x, y}>`. Single pointer = pan, two pointers = pinch zoom. Updates reactive state.

**When to use:** On the crop frame container element.

**Key detail:** The action receives a callback or store reference to push pan/zoom deltas. Keep gesture math as pure functions separate from the action wiring.

**Example:**
```typescript
export function panZoom(node: HTMLElement, callbacks: {
  onPan: (dx: number, dy: number) => void;
  onZoom: (factor: number, centerX: number, centerY: number) => void;
}) {
  const pointers = new Map<number, { x: number; y: number }>();

  function onPointerDown(e: PointerEvent) {
    node.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId)!;

    if (pointers.size === 1) {
      callbacks.onPan(e.clientX - prev.x, e.clientY - prev.y);
    } else if (pointers.size === 2) {
      // Pinch zoom logic
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onPointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerUp);
  node.addEventListener('pointercancel', onPointerUp);

  return {
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointercancel', onPointerUp);
    }
  };
}
```

### Pattern 3: Normalized Crop State

**What:** Store pan and zoom as image-relative values, not pixel coordinates. Pan is stored as the fraction (0-1) of the source image visible at the crop frame's top-left corner. Zoom is stored as the ratio of crop-frame-width to source-image-width.

**Why:** Screen coordinates change on window resize, orientation change, or devicePixelRatio change. Normalized coordinates are stable -- the same state always maps to the same crop region regardless of display.

**Example:**
```typescript
// crop.svelte.ts
interface CropState {
  // Normalized offset: fraction of source image at top-left of crop frame
  offsetX: number;  // 0 = left edge, 1 = right edge
  offsetY: number;  // 0 = top edge, 1 = bottom edge
  // Zoom: how much of the source image width fills the crop frame width
  // 1.0 = image width fits exactly in crop frame
  // 0.5 = half the image width fills the crop frame (zoomed in 2x)
  zoomFraction: number;
}

let cropState = $state<CropState>({ offsetX: 0, offsetY: 0, zoomFraction: 1.0 });
```

### Pattern 4: Off-Screen Canvas Export

**What:** When user clicks download, create a temporary `<canvas>` at exact target dimensions. Map normalized crop state back to source-image pixel coordinates. Use `drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)` to extract the crop region. Call `toBlob` then `changedpi` then trigger download.

**When to use:** Only at export time. Never for display.

**Example:**
```typescript
import { changeDpiBlob } from 'changedpi';

async function exportCrop(
  img: HTMLImageElement,
  crop: CropState,
  target: { width: number; height: number; dpi: number; format: 'png' | 'jpeg' }
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext('2d')!;

  // Map normalized state to source pixels
  const sx = crop.offsetX * img.naturalWidth;
  const sy = crop.offsetY * img.naturalHeight;
  const sw = crop.zoomFraction * img.naturalWidth;
  const sh = sw * (target.height / target.width); // maintain aspect ratio

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, target.width, target.height);

  const mimeType = target.format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = target.format === 'jpeg' ? 1.0 : undefined;

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), mimeType, quality)
  );

  return changeDpiBlob(blob, target.dpi);
}
```

### Anti-Patterns to Avoid
- **Exporting from the display canvas:** Display is at screen resolution. Export needs exact target dimensions from source image. Always use a separate off-screen canvas.
- **Storing pan/zoom as pixel coordinates:** Breaks on resize, orientation change, DPI change. Use normalized coordinates.
- **Manually reading EXIF for rotation:** Modern browsers auto-rotate. Adding an EXIF library causes double-rotation.
- **Using `touch-action: manipulation` on the crop area:** Must be `touch-action: none` to prevent ALL browser gesture interference. Use `manipulation` on the rest of the page.
- **Re-creating canvas in Svelte reactive updates:** Causes iOS Safari memory leaks. Keep stable canvas references.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DPI metadata in exported images | Custom PNG pHYs / JPEG JFIF header manipulation | `changedpi` | Header format parsing is fiddly and format-specific. Library is 3KB, non-destructive, handles both PNG and JPEG. |
| Image pan/zoom gesture handling | CSS-only approach or manual touch events | Native Pointer Events API | Pointer Events unify mouse, touch, and pen in one code path. Touch Events are a separate, older API with different semantics. |
| JPEG quality control for file size | Iterative compression loop | Single `toBlob('image/jpeg', 0.92)` call | At 1200x1600 pixels, quality 0.92 produces files well within 70KB-3.5MB for typical passport photo content. No iterative sizing needed. |
| Responsive aspect ratio container | Manual resize observer math | CSS `aspect-ratio: 35/45` | Native CSS property, supported in all target browsers. |

## Common Pitfalls

### Pitfall 1: Canvas DPI Produces Wrong Print Size
**What goes wrong:** Exported 413x531 PNG has 96 DPI metadata. Printer renders it at 109x140mm instead of 35x45mm.
**Why it happens:** Canvas `toBlob` always embeds browser default DPI (72 or 96). No native API to set it.
**How to avoid:** Post-process every exported blob with `changeDpiBlob(blob, 300)`. This is a one-liner wrapping the export.
**Warning signs:** Printed photo is the wrong physical size despite correct pixel dimensions.

### Pitfall 2: Chromium JPEG Chroma Subsampling
**What goes wrong:** JPEG exported at quality < 1.0 in Chrome has visibly blurred facial features and hairlines.
**Why it happens:** Chromium applies 4:2:0 chroma subsampling at any quality below 1.0. Known bug since 2019 (Chromium #972180), unfixed.
**How to avoid:** EXPD-01 (print): export as JPEG at quality 1.0 (native resolution, no subsampling). EXPD-02 (digital): export as JPEG at quality 0.92. The subsampling at 0.92 is acceptable here since the primary goal is file size control (70KB-3.5MB), and the resolution cap (1200x1600) means the effect is minimal.
**Warning signs:** Export looks fine in Firefox but soft/blurry in Chrome.

### Pitfall 3: EXIF Double-Rotation
**What goes wrong:** Phone photos appear sideways or upside-down after loading.
**Why it happens:** Browsers auto-rotate based on EXIF since 2020. If you also manually rotate, it doubles.
**How to avoid:** Do nothing. Load the image with `new Image()` + `URL.createObjectURL()`. The browser handles EXIF orientation. Do NOT add any EXIF library.
**Warning signs:** Adding an EXIF library makes some photos worse.

### Pitfall 4: Mobile Browser Gesture Conflicts
**What goes wrong:** Pinch-to-zoom the photo triggers browser page zoom instead. Double-tap triggers browser zoom.
**Why it happens:** Browser zoom is an accessibility feature that resists disabling. CSS `touch-action` is the correct solution.
**How to avoid:** Set `touch-action: none` on the crop area container. Set `touch-action: manipulation` on the page body. Use Pointer Events (not Touch Events) -- they integrate with `touch-action`.
**Warning signs:** Only detectable on real mobile devices, not desktop emulation.

### Pitfall 5: Svelte 5 $effect and Canvas Rendering
**What goes wrong:** Canvas repaints fire too frequently, causing jank. Or state changes inside `requestAnimationFrame` aren't tracked.
**Why it happens:** `$effect` runs as a microtask on every state change. Values read inside `requestAnimationFrame` callbacks aren't tracked (async).
**How to avoid:** For the CSS transform approach, this is a non-issue -- Svelte handles reactive style binding natively. For the export canvas (runs once on button click), no `$effect` is needed. If canvas display were needed, read state synchronously in `$effect`, then call `requestAnimationFrame` with the already-captured values.
**Warning signs:** Choppy panning, duplicate renders.

### Pitfall 6: Zoom Clamping Bounds
**What goes wrong:** User zooms out until image doesn't fill the crop frame (empty space visible), or zooms in past the point where source resolution drops below 300 DPI.
**Why it happens:** No min/max bounds on zoom.
**How to avoid:** Minimum zoom: image must fill the crop frame completely (no empty pixels). Maximum zoom: source pixels per export pixel must be >= 1.0 (i.e., the crop region in source pixels must be >= export dimensions). Calculate these bounds from source image dimensions and crop frame aspect ratio.

## Code Examples

### Australian Passport Spec Constants
```typescript
// Source: https://www.passports.gov.au/help/passport-photos
export const AU_PASSPORT_SPEC = {
  // Photo dimensions (mm)
  photoWidthMm: 35,
  photoHeightMm: 45,
  aspectRatio: 35 / 45, // ~0.778

  // Face size (chin to crown, mm)
  faceHeightMinMm: 32,
  faceHeightMaxMm: 36,

  // As fraction of photo height
  faceHeightMinFrac: 32 / 45, // ~0.711
  faceHeightMaxFrac: 36 / 45, // ~0.800

  // Export targets
  // Print: native resolution crop (these are minimums, not targets)
  printExport: {
    widthPx: 413,   // 35mm at 300 DPI — minimum acceptable
    heightPx: 531,  // 45mm at 300 DPI — minimum acceptable
    dpi: 300,
    format: 'jpeg' as const,
    quality: 1.0,
  },
  // Digital: capped dimensions, never upscale, quality for file size control
  digitalExport: {
    widthPx: 1200,
    heightPx: 1600,  // ~35:45 aspect ratio (actually 3:4, close enough)
    dpi: 300,
    format: 'jpeg' as const,
    quality: 0.92,
    minSizeBytes: 70 * 1024,    // 70 KB
    maxSizeBytes: 3.5 * 1024 * 1024, // 3.5 MB
  },

  // Child-specific rules
  childRules: {
    under3: {
      mouthMayBeOpen: true,
      eyeLeniency: true,
      noToysOrObjects: true,
    },
    age3Plus: {
      sameAsAdult: true,
    },
  },
} as const;
```

### Download Trigger
```typescript
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### HiDPI Canvas Setup (for any future display canvas needs)
```typescript
function setupHiDPICanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return ctx;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual EXIF rotation | Browser auto-rotation (`image-orientation: from-image`) | Chrome 81 / 2020 | Do NOT add EXIF libraries for rotation |
| Separate mouse + touch events | Pointer Events API | Baseline since 2020 | One code path for all input devices |
| `on:click` in Svelte templates | `onclick` attribute (Svelte 5) | Svelte 5 / 2024 | Standard HTML attribute syntax |
| Writable stores (`writable()`) | `$state` runes | Svelte 5 / 2024 | Direct variable assignment, deep reactivity |
| `$:` reactive statements | `$derived` and `$effect` | Svelte 5 / 2024 | Explicit dependency tracking |
| JPEG export at 0.92 quality | JPEG at 1.0 for print (max quality), 0.92 for digital (file size control) | Ongoing (Chromium bug unfixed) | Print uses quality 1.0 to avoid subsampling; digital uses 0.92 as an acceptable trade-off for file size |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest, ships with SvelteKit) |
| Config file | `vite.config.ts` (vitest config section) -- Wave 0 |
| Quick run command | `bun run test` |
| Full suite command | `bun run test -- --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOAD-01 | File input creates Image object with valid dimensions | unit | `bun run test -- --run src/lib/state/crop.svelte.test.ts` | Wave 0 |
| CROP-01 | Aspect ratio container matches 35:45 | manual-only | Visual verification -- CSS `aspect-ratio` is declarative | N/A |
| CROP-02 | Pan updates crop state correctly | unit | `bun run test -- --run src/lib/actions/panZoom.test.ts` | Wave 0 |
| CROP-03 | Zoom updates crop state with correct clamping | unit | `bun run test -- --run src/lib/actions/panZoom.test.ts` | Wave 0 |
| CROP-04 | Overlay darkens outside crop frame | manual-only | Visual verification -- CSS overlay | N/A |
| CROP-05 | Chin guide band positioned at correct fraction | unit | `bun run test -- --run src/lib/state/spec.test.ts` | Wave 0 |
| CROP-06 | Crown guide band positioned at correct fraction | unit | `bun run test -- --run src/lib/state/spec.test.ts` | Wave 0 |
| CROP-07 | Crown hint is visible | manual-only | Visual verification | N/A |
| EXPD-01 | Export produces 413x531 PNG with 300 DPI metadata | unit | `bun run test -- --run src/lib/canvas/export.test.ts` | Wave 0 |
| EXPD-02 | Export produces 1200x1600 JPEG within 70KB-3.5MB | unit | `bun run test -- --run src/lib/canvas/export.test.ts` | Wave 0 |
| INFO-01 | Spec panel displays required information | manual-only | Visual verification | N/A |
| INFO-02 | Child notes visible | manual-only | Visual verification | N/A |
| COMPAT-01 | Works on desktop Chrome/Firefox | manual-only | Manual browser testing | N/A |
| COMPAT-02 | Works on Android Chrome | manual-only | Manual device testing | N/A |

### Sampling Rate
- **Per task commit:** `bun run test -- --run`
- **Per wave merge:** `bun run test -- --run && bun run build`
- **Phase gate:** Full suite green + manual browser check before verify

### Wave 0 Gaps
- [ ] `vite.config.ts` -- vitest configuration (add via `bunx sv add vitest` or manual config)
- [ ] `src/lib/state/spec.test.ts` -- covers CROP-05, CROP-06 (guide band position math)
- [ ] `src/lib/actions/panZoom.test.ts` -- covers CROP-02, CROP-03 (gesture delta calculations)
- [ ] `src/lib/canvas/export.test.ts` -- covers EXPD-01, EXPD-02 (export dimensions, format, DPI)

## Open Questions

1. ~~**Digital export aspect ratio: 3:4 vs 35:45**~~ — RESOLVED: Use 35:45 crop frame for positioning, digital export scales to fit within 1200x1600 maintaining 35:45 ratio.

2. ~~**EXPD-01 says "JPEG" but decision says "PNG"**~~ — RESOLVED: Both exports use JPEG. Print at quality 1.0 (native resolution, max quality). Digital at quality 0.92 (file size control).

3. **changedpi TypeScript types**
   - What we know: The library is plain JS (ES6). No `@types/changedpi` package found.
   - Recommendation: Create a `changedpi.d.ts` declaration file in the project. Two functions: `changeDpiDataUrl(dataUrl: string, dpi: number): string` and `changeDpiBlob(blob: Blob, dpi: number): Blob`.

## Sources

### Primary (HIGH confidence)
- [Australian Passport Office - Passport Photos](https://www.passports.gov.au/help/passport-photos) -- Photo dimensions, face size ranges, child rules
- [Department of Home Affairs - Citizenship Photo Requirements](https://immi.homeaffairs.gov.au/citizenship/photo-requirements-for-citizenship-applications) -- Digital submission: JPEG, 70KB-3.5MB, 1200x1600 px
- [Svelte 5 Docs - $effect](https://svelte.dev/docs/svelte/$effect) -- Canvas rendering pattern, dependency tracking
- [Svelte 5 Docs - $state](https://svelte.dev/docs/svelte/$state) -- Deep reactivity for object state
- [Svelte Docs - Testing](https://svelte.dev/docs/svelte/testing) -- Vitest setup, `bunx sv add vitest`
- [SvelteKit Docs - Creating a project](https://svelte.dev/docs/kit/creating-a-project) -- `bunx sv create`
- [SvelteKit Docs - adapter-static](https://svelte.dev/docs/kit/adapter-static) -- Static site configuration
- [MDN - Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) -- Unified input handling
- [MDN - HTMLCanvasElement.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) -- Export API
- [MDN - touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) -- Mobile gesture conflict prevention
- [Bun - Build an app with SvelteKit](https://bun.sh/guides/ecosystem/sveltekit) -- `bunx sv create` with bun

### Secondary (MEDIUM confidence)
- [changedpi on npm](https://www.npmjs.com/package/changedpi) -- v1.0.4, MIT license, Shutterstock
- [changedpi GitHub](https://github.com/shutterstock/changeDPI) -- Source, PNG bug fix (2018), API
- [Chromium Bug #972180](https://bugs.chromium.org/p/chromium/issues/detail?id=972180) -- JPEG chroma subsampling at quality < 1.0

### Tertiary (LOW confidence)
- JPEG file size at 1200x1600: quality 0.92 produces files well within 70KB-3.5MB for passport photo content. Exact size depends on image complexity.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- locked decisions from STATE.md, verified versions
- Architecture: HIGH -- CSS transform + off-screen canvas is well-established pattern; prior project research is thorough
- Pitfalls: HIGH -- verified against MDN docs, Chromium bug tracker, browser specs
- Australian specs: HIGH -- sourced from official government websites
- Export file sizes: MEDIUM -- estimated from compression ratios, needs empirical validation

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, no fast-moving dependencies)
