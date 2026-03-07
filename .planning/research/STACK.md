# Technology Stack

**Project:** PassPhoto
**Researched:** 2026-03-07

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SvelteKit | ^2.53 | App framework | User preference. Active development, Svelte 5 runes for clean reactive state. Static adapter means zero server dependency for local use. | HIGH |
| Svelte | ^5.53 | UI framework | Runes (`$state`, `$derived`) are a natural fit for reactive crop position/zoom state. Compiled output means tiny bundle for a single-purpose tool. | HIGH |
| TypeScript | ^5.5 | Type safety | Passport spec dimensions, crop coordinates, and print layout math all benefit from typed interfaces. SvelteKit scaffolds with TS by default. | HIGH |

### Image Cropping & Manipulation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Canvas API (native) | N/A | Crop extraction, overlay rendering, print layout | No library needed. `drawImage()` with source-rect params handles crop. `toBlob()` handles export. Avoids dependency for what amounts to ~50 lines of code. | HIGH |
| Custom pan/zoom via Pointer Events | N/A | Touch + mouse interaction | Native Pointer Events API handles mouse, touch, and pen uniformly. Pinch-zoom via two-pointer distance tracking. ~100 lines of Svelte action code. Avoids library lock-in for a gesture surface this simple. | HIGH |

**Why NOT svelte-easy-crop:** The library provides a generic crop UI with a fixed rectangular crop area and basic grid overlay. PassPhoto needs custom semi-transparent guide bands showing chin/crown/face-width zones from Australian spec ranges. svelte-easy-crop does not expose overlay slots or custom rendering inside the crop area. Forking it to add custom overlays defeats the purpose of using a library. Building the pan/zoom + overlay from scratch is simpler than adapting a library not designed for this use case.

**Why NOT svelte-crop-window:** Version 0.1.1, last published over a year ago. Unclear Svelte 5 compatibility. Not worth the risk for a small project.

**Why NOT WebGL:** Massive overkill. We're cropping a single photo, not running filters or real-time effects. Canvas 2D API is the right tool.

### Export & Download

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Canvas `toBlob()` + `URL.createObjectURL()` | N/A | Image export/download | Native browser APIs. No library needed. Create a blob from the cropped canvas, create an object URL, trigger download via a temporary `<a>` element with `download` attribute. Works in all modern browsers. | HIGH |

**Why NOT file-saver:** `FileSaver.js` was useful when browser download APIs were inconsistent. In 2026, `<a download>` + `URL.createObjectURL()` works everywhere. Zero-dependency approach is correct here.

### Print Layout Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Canvas API (native) | N/A | Tile photos onto print-size canvas | Create a canvas at print dimensions (e.g., 4x6" at 300 DPI = 1200x1800px). Use `drawImage()` to tile the cropped photo in a grid. Export as JPEG for printing. | HIGH |
| jsPDF | ^4.2 | PDF export (optional, deferred) | If users want a PDF instead of a JPEG print sheet. `addImage()` accepts canvas data directly. Only add if JPEG print layout proves insufficient. | MEDIUM |

**Print layout math (35x45mm on 4x6"):**
- 4x6" = 101.6 x 152.4mm
- 35x45mm photo tiles: 2 columns x 3 rows = 6 photos per sheet
- At 300 DPI: photo = 413 x 531px, sheet = 1200 x 1800px
- Straightforward canvas arithmetic, no layout engine needed.

**Why start with JPEG over PDF:** Users will print these at home or at a photo kiosk. Both accept JPEG. PDF adds a dependency and complexity for no gain in the common case. Add jsPDF later only if needed.

### Development & Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | ^6.x | Build tool | Ships with SvelteKit. Fast HMR, zero config needed. | HIGH |
| bun | latest | Runtime & package manager | User preference (mentioned in PROJECT.md). Fast install, native TS execution for any scripts. | HIGH |
| @sveltejs/adapter-static | latest | Static site generation | No server needed. Produces a directory of HTML/JS/CSS that can be opened directly or served locally. | HIGH |
| Prettier + prettier-plugin-svelte | latest | Formatting | Standard Svelte ecosystem formatter. | HIGH |
| ESLint + eslint-plugin-svelte | latest | Linting | Standard Svelte ecosystem linter. SvelteKit scaffolding includes this. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Crop interaction | Custom Pointer Events | svelte-easy-crop v5 | No custom overlay support; our guides are the core UX, not an afterthought |
| Crop interaction | Custom Pointer Events | svelte-crop-window 0.1.1 | Stale, unclear Svelte 5 compat, low npm downloads |
| Gesture handling | Native Pointer Events | svelte-gestures | Adds abstraction over what we need (just pan + pinch). Pointer Events API is simple enough. |
| Image rendering | Canvas 2D | WebGL / Three.js | Overkill for single-image crop |
| Image rendering | Canvas 2D | CSS transforms only | Can't extract pixel data for crop export. Need canvas for final output regardless. |
| File download | Native `<a download>` | FileSaver.js | Browser support is universal now. Unnecessary dependency. |
| Print layout | Canvas JPEG | jsPDF | PDF adds complexity with no benefit for home/kiosk printing. Defer to later phase if needed. |
| Package manager | bun | npm/pnpm | User preference. Compatible with all npm packages. |

## Key Architecture Decisions

### Dual-Canvas Approach
Use **CSS transforms** for the interactive viewport (fast, GPU-accelerated pan/zoom) and a **hidden Canvas** for crop extraction and print layout. The interactive view doesn't need to be a canvas -- DOM elements with `transform: translate() scale()` are smoother and simpler to overlay with HTML guide elements.

This means:
1. **Viewport**: `<img>` with CSS `transform` for pan/zoom, HTML/SVG overlay for guides
2. **Export canvas**: Off-screen `<canvas>`, used only when user clicks "Download" or "Print Layout"

### Svelte Actions for Gestures
Implement pan/zoom as a Svelte action (`use:panZoom`) that attaches Pointer Event listeners and updates `$state` variables for position and scale. This keeps gesture logic reusable and testable, separate from the component rendering.

### Zero External Image Dependencies
The entire image pipeline (load, display, crop, tile, export) uses native browser APIs. The only runtime dependency is SvelteKit itself. This matches the project constraint of "minimal dependencies."

## Installation

```bash
# Scaffold project
bunx sv create passphoto
# Select: SvelteKit minimal, TypeScript, Prettier, ESLint

# No additional runtime dependencies needed for MVP
# The entire image pipeline uses native browser APIs

# Optional (deferred): PDF export
# bun add jspdf
```

## Dependency Count

| Category | Count | Packages |
|----------|-------|----------|
| Runtime | 0 | Native browser APIs only |
| Framework | 1 | SvelteKit (includes Svelte, Vite) |
| Dev tooling | ~3 | Prettier, ESLint, adapter-static |
| Deferred | 1 | jsPDF (only if PDF export needed) |

Total runtime dependencies beyond SvelteKit: **zero**.

## Sources

- [SvelteKit releases](https://github.com/sveltejs/kit/releases) -- SvelteKit 2.53.4 (March 2026)
- [Svelte npm](https://www.npmjs.com/package/svelte) -- Svelte 5.53.7 (March 2026)
- [svelte-easy-crop](https://github.com/ValentinH/svelte-easy-crop) -- v5.0.0, Svelte 5 support, no custom overlay slots
- [svelte-crop-window](https://github.com/sabine/svelte-crop-window) -- v0.1.1, last updated ~1 year ago
- [Pointer Events: Pinch zoom gestures (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures) -- Native gesture handling
- [Canvas toBlob() (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) -- Native image export
- [jsPDF](https://www.npmjs.com/package/jspdf) -- v4.2.0 (March 2026)
- [Australian passport photo specs](https://www.passports.gov.au/help/passport-photos) -- 35-40mm wide, 45-50mm high, 32-36mm chin to crown
