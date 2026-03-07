# Pitfalls Research

**Domain:** Browser-based passport photo cropping (canvas image manipulation)
**Researched:** 2026-03-07
**Confidence:** HIGH (verified across MDN, browser bug trackers, WHATWG spec discussions)

## Critical Pitfalls

### Pitfall 1: Canvas Resolution vs Display Size (Retina/HiDPI)

**What goes wrong:**
The canvas renders at CSS pixel resolution (e.g., 350x450) but the device has a `devicePixelRatio` of 2 or 3. The displayed canvas looks blurry because it is being upscaled by the browser. Worse: the *exported* image is only 350x450 pixels -- far below the 300 DPI requirement for a 35x45mm print (which needs ~413x531 pixels minimum).

**Why it happens:**
Canvas `width`/`height` attributes set the backing store resolution. CSS `width`/`height` sets the display size. Developers set them to the same value, unaware these are independent. The browser then stretches a low-res backing store to fill a high-res display.

**How to avoid:**
Separate concerns: the *display* canvas (what the user sees while editing) needs `devicePixelRatio` scaling for crisp rendering. The *export* canvas (what gets saved) must be sized to exactly the print pixel dimensions (413x531 for 35x45mm at 300 DPI) regardless of screen DPI. Use two canvases -- one for interaction, one offscreen for export.

```javascript
// Display canvas: scale for crisp rendering
const dpr = window.devicePixelRatio || 1;
canvas.width = cssWidth * dpr;
canvas.height = cssHeight * dpr;
canvas.style.width = `${cssWidth}px`;
canvas.style.height = `${cssHeight}px`;
ctx.scale(dpr, dpr);

// Export canvas: fixed at print resolution
const exportCanvas = document.createElement('canvas');
exportCanvas.width = 413;  // 35mm at 300 DPI
exportCanvas.height = 531; // 45mm at 300 DPI
```

**Warning signs:**
- Canvas content looks fuzzy on phones/retina Macs but fine on a 1x display
- Exported images are noticeably smaller (in pixels) than expected
- Print output is blurry despite appearing fine on screen

**Phase to address:**
Phase 1 (core canvas setup). This is foundational -- getting it wrong means every subsequent feature operates on the wrong resolution.

---

### Pitfall 2: EXIF Orientation Double-Rotation

**What goes wrong:**
Modern browsers (Chrome 81+, Safari 13.1+, Firefox 26+) now auto-rotate images based on EXIF orientation metadata by default (`image-orientation: from-image`). If you *also* read EXIF data and manually rotate before drawing to canvas, the image gets rotated twice. A portrait photo taken on a phone ends up upside-down or sideways.

Conversely, if you rely entirely on the browser's auto-rotation but use `createImageBitmap` with `imageOrientation: "none"` (to get raw pixel data for cropping), the image is suddenly unrotated and appears sideways.

**Why it happens:**
Most EXIF-rotation tutorials and libraries (exif-js, canvas-exif-orientation) were written before browsers auto-rotated. Developers copy old patterns without realizing the browser already handled it. The spec change landed between 2019-2020, but library README files still describe the old workaround.

**How to avoid:**
Do NOT manually read and apply EXIF rotation. Modern browsers handle it. When drawing from an `<img>` element to canvas via `drawImage()`, the image is already correctly oriented. If you need raw unrotated pixel data (unlikely for this app), explicitly use `createImageBitmap(blob, { imageOrientation: "none" })`.

Test with real phone photos -- particularly:
- iPhone portrait (EXIF orientation 6: 90 CW)
- iPhone selfie (EXIF orientation 6 + horizontal flip)
- Photos taken in landscape then cropped in the Photos app

**Warning signs:**
- Photos appear rotated 90/180/270 degrees on some devices but not others
- Adding an EXIF library to "fix" orientation makes the problem worse on modern browsers
- `createImageBitmap` results differ from `drawImage` on the same image

**Phase to address:**
Phase 1 (image loading). Load a phone photo, draw it, verify orientation is correct -- do this before building any crop UI.

---

### Pitfall 3: Mobile Touch Gesture Conflicts (Pinch-Zoom vs Browser Zoom)

**What goes wrong:**
The app needs pinch-to-zoom for positioning the photo within the crop frame. But the browser also interprets pinch gestures as page zoom. The user tries to zoom into their photo and instead zooms the entire browser viewport. Double-tap to reposition triggers the browser's double-tap-to-zoom. Scrolling the page interferes with panning the image.

On iOS Safari specifically, `user-scalable=no` in the viewport meta tag has been ignored since iOS 10+. The standard workaround (`touch-action: none`) has inconsistent support on older Safari versions.

**Why it happens:**
Browser zoom is an accessibility feature that browsers actively resist disabling. iOS Safari deliberately ignores `user-scalable=no`. The CSS `touch-action` property is the correct solution, but developers either don't use it or apply it to the wrong element.

**How to avoid:**
1. Set `touch-action: none` on the canvas/interaction area (NOT the body -- that breaks accessibility).
2. Use Pointer Events (not Touch Events) for gesture handling. Pointer Events integrate with `touch-action` properly and fire `pointercancel` when the browser takes over a gesture.
3. Add `touch-action: manipulation` to the page body to allow scrolling but prevent double-tap zoom.
4. Prevent `gesturestart` on iOS for the canvas element specifically.
5. Set all form input font sizes to >= 16px to prevent iOS auto-zoom on focus.

```css
/* Canvas area: app handles all gestures */
.crop-area { touch-action: none; }

/* Rest of page: scroll yes, zoom no */
body { touch-action: manipulation; }
```

**Warning signs:**
- Testing only on desktop misses this entirely
- Browser viewport "jumps" when interacting with the crop area on mobile
- User accidentally zooms the page and can't get back to normal view
- Two-finger gestures feel "laggy" (browser is competing for the gesture)

**Phase to address:**
Phase 2 (pan/zoom interaction). Must be tested on real iOS and Android devices -- desktop browser emulation does not reproduce these conflicts accurately.

---

### Pitfall 4: Export Quality Loss from Chromium JPEG Chroma Subsampling

**What goes wrong:**
Chromium (Chrome, Edge, Opera, Brave) applies 4:2:0 chroma subsampling to JPEG exports at *any* quality below 1.0. This means `canvas.toBlob(cb, 'image/jpeg', 0.92)` -- the commonly recommended quality -- produces visibly blurry output, especially around sharp edges (text, facial features, hairlines). This is a known Chromium bug (#972180) that has been open since 2019 and remains unfixed.

Firefox disables subsampling at quality >= 0.90, producing much better results at the same quality setting.

**Why it happens:**
Chromium's JPEG encoder only disables chroma subsampling at quality === 1.0. At 0.99 or below, it applies aggressive subsampling that smears color information. Developers test at quality 0.92 (a common recommendation), see acceptable results on their monitor, and don't notice the subsampling artifacts until the photo is printed at 300 DPI where every pixel matters.

**How to avoid:**
Export as PNG for the primary crop output. PNG is lossless, and for a single 413x531 pixel image the file size is small (~200-400KB). Use PNG for the cropped passport photo, and only use JPEG for the print layout sheet (where the larger 4x6 / A4 image benefits from compression).

If JPEG is required, use quality 1.0 in Chromium to avoid subsampling, or export as PNG and let the user's print workflow handle format conversion.

```javascript
// Prefer PNG for the cropped passport photo
exportCanvas.toBlob(blob => { /* save */ }, 'image/png');

// For print layout (larger file), JPEG 1.0 is acceptable
layoutCanvas.toBlob(blob => { /* save */ }, 'image/jpeg', 1.0);
```

**Warning signs:**
- Exported photos look slightly "soft" compared to the on-screen preview
- Hair and facial edges appear smudged in the exported file
- Quality looks fine in Firefox but degraded in Chrome

**Phase to address:**
Phase 3 (export). Decision should be made early (Phase 1 design) but implementation is in the export phase.

---

### Pitfall 5: DPI Metadata Not Set in Exported Images

**What goes wrong:**
`canvas.toBlob()` always produces images with 96 DPI metadata (72 DPI on some browsers). When printed, the image is interpreted at 96 DPI instead of 300 DPI, causing the printer to render it at the wrong physical size. A 413x531 pixel image at 96 DPI prints as ~109x140mm instead of the intended 35x45mm. The user must manually figure out scaling in their print dialog.

**Why it happens:**
The Canvas API has no mechanism to set DPI metadata. `toBlob()` and `toDataURL()` always embed the browser's default DPI. Developers assume "correct pixel dimensions = correct print size," but print software uses embedded DPI metadata to determine physical dimensions.

**How to avoid:**
Use the `changedpi` npm package to patch DPI metadata in the exported blob. This library modifies only the file header (JFIF for JPEG, pHYs chunk for PNG) without re-encoding the image data, so it is lossless and fast.

```javascript
import { changeDpiBlob } from 'changedpi';

exportCanvas.toBlob(async (blob) => {
  const correctedBlob = changeDpiBlob(blob, 300);
  // save correctedBlob
}, 'image/png');
```

For the print layout, this is even more critical -- a 4x6 inch sheet at 300 DPI is 1200x1800 pixels, and without correct DPI metadata, print dialogs will try to render it at 12.5x18.75 inches.

**Warning signs:**
- Printed output is the wrong physical size despite correct pixel dimensions
- User has to manually set "actual size" / "100%" in print dialog
- Print preview shows the image filling the page instead of being 35x45mm

**Phase to address:**
Phase 3 (export). The `changedpi` dependency should be selected during Phase 1 (stack decisions).

---

### Pitfall 6: iOS Safari Canvas Memory Limits

**What goes wrong:**
iOS Safari enforces a maximum canvas area of 16,777,216 pixels (increased to 67,108,864 in iOS 18+, but older devices remain constrained). Total canvas memory across all canvas elements is limited to ~384MB. A modern phone photo is typically 12MP (4032x3024 = ~12.2M pixels). Loading this into a canvas at `devicePixelRatio` 3 would require a canvas of 12,096 x 9,072 = ~109M pixels -- far exceeding any limit. Safari silently fails: the canvas becomes unusable with no error thrown.

Additionally, Safari hoards disposed canvas memory. Creating and discarding canvases (e.g., during re-renders in a reactive framework like Svelte) accumulates memory until Safari kills the tab.

**Why it happens:**
Developers test on desktop Chrome (268M pixel limit) and never hit the wall. iOS devices have constrained GPU memory. The error is silent -- `drawImage()` simply produces a blank or corrupted result.

**How to avoid:**
1. Downscale the source image before putting it on canvas. For a 35x45mm crop at 300 DPI, you never need more than ~2000x2000 pixels of source data visible at once.
2. Track canvas memory manually. When creating a new canvas, first resize old ones to 1x1 and clear them to force Safari to release memory.
3. Do NOT multiply source image dimensions by `devicePixelRatio` -- only the display canvas needs DPR scaling.
4. Test on the oldest iOS version you support.

```javascript
// Before disposing a canvas (Svelte component destroy)
canvas.width = 1;
canvas.height = 1;
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, 1, 1);
```

**Warning signs:**
- App works on desktop but shows blank/white canvas on iPhone
- Canvas intermittently goes blank after panning/zooming
- No JavaScript error in console (Safari fails silently)
- Problem only appears on older iPhones or iPads

**Phase to address:**
Phase 1 (image loading) and Phase 2 (interaction). Image downscaling must happen at load time. Canvas cleanup must be wired into Svelte component lifecycle.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using one canvas for both display and export | Simpler code, fewer state sync issues | Export resolution tied to screen size; retina displays export too-large files, low-DPI displays export blurry files | Never -- always use separate display/export canvases |
| Hardcoding `devicePixelRatio` to 2 | Avoids checking, works on most retina screens | Breaks on 1x displays (desktop monitors) and 3x displays (newer phones) | Never -- always read actual DPR |
| Storing crop state as pixel coordinates | Direct mapping to canvas, no math | Breaks when canvas resizes (window resize, orientation change, responsive layout) | Never -- store as normalized 0-1 coordinates relative to the source image |
| Skipping `changedpi` and telling users to set print scale manually | No dependency needed | Every user hits the same confusion; passport photo prints at wrong size | Never for this project -- DPI metadata is essential for the print use case |
| Using `drawImage()` with the full source image on every pan/zoom frame | Works for small images | Slow on mobile with 12MP+ photos; janky panning | Acceptable for MVP if images are pre-downscaled at load time |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Drawing full-resolution source image on every frame during pan/zoom | Janky/choppy panning on mobile, dropped frames | Downscale source to a working resolution at load time; only use full-res for final export | Photos > 4MP on mid-range phones |
| Re-creating canvas element on every Svelte reactive update | Memory leak on iOS Safari, eventual tab crash | Use `bind:this` to keep a stable canvas reference; update via imperative `drawImage()` calls, not reactive DOM updates | After 10-20 interactions on iOS |
| Using CSS transforms on the canvas element instead of transforming the drawing context | Browser re-composites the entire canvas layer on each transform change | Apply pan/zoom as `ctx.translate()` / `ctx.scale()` transforms within the drawing context, or use CSS transforms on a wrapper `<div>` containing an `<img>` (not the canvas) | Noticeable at 60fps on any mobile device |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No indication of what "acceptable" face size means | User crops to what looks right, gets rejected at the passport office | Show shaded boundary zones (as specified in PROJECT.md) with clear labels: "chin should be in this zone", "top of head should be in this zone" |
| Crop frame moves instead of the image | Unintuitive -- users expect to drag the photo, not the frame. Every phone photo app works by moving the image. | Fixed crop frame overlay; user pans/zooms the image underneath it |
| No visual feedback during export | User clicks "download", nothing visible happens for 1-2 seconds, they click again | Show a brief loading state or immediately trigger the download |
| Overlay guides obscure the face completely | Guides are so prominent the user can't see the face underneath | Use semi-transparent colored bands (10-20% opacity) with thin edge lines |
| Pinch zoom has no minimum/maximum bounds | User zooms out until the photo is a speck, or zooms in past pixel resolution | Clamp zoom: minimum = crop frame fills with image (no empty space), maximum = where source resolution would produce < 300 DPI output |
| Print layout doesn't show cut lines | User prints the 4x6 sheet but can't cut straight -- individual photos end up crooked | Add thin hairline guides (0.5pt) between tiled photos, with small crop marks at corners |

## "Looks Done But Isn't" Checklist

- [ ] **Image loading:** Test with a real iPhone photo (EXIF orientation 6), a screenshot (no EXIF), and a landscape photo -- all three must display correctly without manual rotation
- [ ] **Export resolution:** Verify the exported PNG is exactly 413x531 pixels (or the target spec) by opening it in an image viewer and checking dimensions -- not just "it looks right"
- [ ] **DPI metadata:** Open the exported file in an image editor (GIMP, Preview.app) and verify DPI reads 300, not 96 or 72
- [ ] **Mobile gestures:** Test on a real iPhone with iOS Safari: pinch zoom the photo (should NOT zoom the browser viewport), double-tap (should NOT zoom the page), single-finger pan (should move the photo, NOT scroll the page)
- [ ] **Print layout:** Print the 4x6 layout on actual photo paper and measure a single photo with a ruler -- it must be 35x45mm (+/- 1mm)
- [ ] **Canvas cleanup:** On iOS Safari, load a photo, crop it, download it, then load another photo and repeat 5 times -- canvas should not go blank or crash the tab
- [ ] **Landscape source photo:** Load a landscape-oriented photo and verify cropping to portrait 35x45mm still works correctly (user must zoom in significantly)
- [ ] **JPEG export quality:** If exporting JPEG, compare output from Chrome and Firefox side-by-side at zoom -- look for chroma smearing around hair/eyes in Chrome

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong canvas resolution (blurry exports) | LOW | Add separate export canvas with fixed pixel dimensions; existing crop logic maps to it via coordinate transform |
| Double EXIF rotation | LOW | Remove the EXIF rotation library; rely on browser auto-rotation; test with phone photos |
| Touch gesture conflicts | MEDIUM | Add `touch-action: none` to crop area; refactor from Touch Events to Pointer Events if needed |
| JPEG quality loss | LOW | Switch export from JPEG to PNG; trivial one-line change |
| Missing DPI metadata | LOW | Add `changedpi` dependency; wrap export in a one-line postprocessing step |
| iOS canvas memory crash | MEDIUM | Add image downscaling at load time; add canvas cleanup in Svelte `onDestroy`; requires testing on real iOS devices |
| Crop state stored as pixels | HIGH | Refactor to normalized coordinates; must update all pan/zoom/export logic; this is why it must be done correctly from Phase 1 |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Canvas resolution vs display size | Phase 1: Canvas setup | Export a test image and verify pixel dimensions match 413x531 |
| EXIF orientation double-rotation | Phase 1: Image loading | Load 3 test photos (iPhone portrait, landscape, screenshot); all display correctly |
| Touch gesture conflicts | Phase 2: Pan/zoom interaction | Test on real iOS Safari and Android Chrome; no browser zoom triggered |
| JPEG chroma subsampling | Phase 3: Export | Compare Chrome vs Firefox export; use PNG to avoid entirely |
| DPI metadata | Phase 3: Export | Open exported file in image editor; confirm 300 DPI |
| iOS canvas memory | Phase 1-2: Image loading + interaction | Load/crop/export cycle 5 times on iOS Safari without blank canvas |
| Print layout sizing | Phase 4: Print layout | Physical measurement of printed output with ruler |
| Crop state as pixel coordinates | Phase 1: Architecture | Resize browser window during crop session; overlay stays aligned |

## Sources

- [MDN: devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)
- [MDN: image-orientation CSS property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-orientation)
- [MDN: touch-action CSS property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)
- [MDN: Pinch zoom gestures with Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures)
- [MDN: HTMLCanvasElement.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- [MDN: createImageBitmap()](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap)
- [WHATWG: image-orientation and canvas drawImage (spec discussion)](https://github.com/w3c/csswg-drafts/issues/4666)
- [WHATWG: createImageBitmap and EXIF orientation (spec discussion)](https://github.com/whatwg/html/issues/7210)
- [Chromium Bug #972180: JPEG exported at 99% quality is blurry](https://bugs.chromium.org/p/chromium/issues/detail?id=972180)
- [WHATWG: Standard for chroma subsampling based on encode quality](https://github.com/whatwg/html/issues/5395)
- [Chrome 81: Correct image orientation for images](https://paul.kinlan.me/correct-image-orientation-for-images-chrome-81/)
- [PQINA: Canvas area exceeds the maximum limit](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/)
- [PQINA: Total canvas memory use exceeds the maximum limit](https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit)
- [changeDPI library (Shutterstock)](https://github.com/shutterstock/changeDPI)
- [Kirupa: Canvas on High-DPI/Retina screens](https://www.kirupa.com/canvas/canvas_high_dpi_retina.htm)
- [Canvas is finally usable on Safari (iOS 18 limit increase)](https://lionpuro.com/posts/canvas-is-finally-usable-on-safari/)
- [Australian Passport Office: Passport photos](https://www.passports.gov.au/help/passport-photos)

---
*Pitfalls research for: browser-based passport photo cropping tool*
*Researched: 2026-03-07*
