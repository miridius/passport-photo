# PassPhoto

## What This Is

A browser-based Australian passport photo cropping tool with guided positioning, dual export (print + digital), and 4-up print sheet generation. Built for a parent preparing passport photos for two young children at home.

## Core Value

Correctly crop a photo so the face size and position fall within the acceptable ranges defined by Australian passport photo requirements — no guesswork.

## Requirements

### Validated

- ✓ Load photo from device via file picker — v1.0
- ✓ Pan/zoom positioning (drag, scroll, pinch, keyboard) within 35:45 crop frame — v1.0
- ✓ Guide bands showing chin and crown acceptable zones — v1.0
- ✓ Crown-vs-hair visual hint — v1.0
- ✓ Spec reference panel with AU requirements and child-specific rules — v1.0
- ✓ Print export at native source resolution (1:1 crop, quality 1.0) — v1.0
- ✓ Digital export capped 1200x1600, quality auto-adjust for 70KB-3.5MB — v1.0
- ✓ 9x13cm print sheet with 4-up tiling, cut marks, 300 DPI metadata — v1.0
- ✓ mm rulers and dimension brackets outside crop frame — v1.0
- ✓ Works on desktop Chrome/Firefox and Android Chrome — v1.0

### Active

(None — next milestone not yet planned)

### Out of Scope

- Face detection / auto-positioning — manual pan and zoom with guides is sufficient
- Multiple country specs — Australia only
- User accounts / cloud storage — purely local tool
- Photo editing (brightness, contrast, background removal) — crop only
- iOS Safari — Chrome and Firefox only
- PDF export — JPEG print sheets work at DM

## Context

Shipped v1.0 with 3,151 LOC (TypeScript + Svelte).
Tech stack: SvelteKit, Svelte 5 runes, Canvas API, changedpi.
Static site via adapter-static, deployable to Cloudflare Pages.
75 unit tests + 69 E2E tests (Vitest + Playwright).

## Constraints

- **Tech stack**: SvelteKit with Svelte 5 runes — user preference
- **Runtime**: `bun` (never npm/npx)
- **Hosting**: Static site — Cloudflare Pages
- **Simplicity**: Minimal dependencies, plain CSS (no Tailwind)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SvelteKit over static HTML | User preference, familiar stack | ✓ Good |
| Boundary zones as shaded bands | Specs define ranges, not exact positions | ✓ Good |
| No face detection | Keeps scope small, guides sufficient | ✓ Good |
| Print export = native source resolution | 1:1 crop, quality 1.0; no DPI tricks | ✓ Good |
| Digital export = never upscale | Cap 1200x1600, binary search quality | ✓ Good |
| Rulers/dimensions outside crop frame | Visible against any photo background | ✓ Good |
| Keyboard controls for pan/zoom | Essential for fine positioning | ✓ Good |
| Pseudo-elements for guide band edges | CSS borders render wrong direction; pseudo-elements match tick alignment | ✓ Good |
| Fixed 300 DPI for print sheet | Pixel dimensions match DPI metadata for correct physical size | ✓ Good |
| Print sheet constants in printSheet.ts | Test isolation from spec.ts; minor color divergence accepted | ⚠️ Revisit |
| adapter-static with SPA fallback | Fully client-side, no SSR needed | ✓ Good |

---
*Last updated: 2026-03-09 after v1.0 milestone*
