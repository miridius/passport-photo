# Milestones

## v1.0 MVP (Shipped: 2026-03-09)

**Phases completed:** 2 phases, 21 plans
**Timeline:** 3 days (2026-03-07 → 2026-03-09)
**Codebase:** 3,151 LOC (TypeScript + Svelte), 103 files changed

**Key accomplishments:**
- Interactive crop editor with pan/zoom (drag, scroll, pinch, keyboard) and Australian passport spec guide bands
- Print and digital JPEG export with native resolution cropping and automatic quality adjustment (binary search for 70KB-3.5MB)
- 9x13cm print sheet with 4-up tiling, 0.5mm buffer zones, cut marks, and 300 DPI metadata
- Preview modal with loading state and URL hash persistence for HMR survival
- 75 unit tests + 69 E2E tests covering layout, export, cut mark geometry, and full user flows

**Tech debt:**
- `PRINT_SHEET` constant in spec.ts orphaned (printSheet.ts uses local constants); cut mark color diverges (#333333 vs #aaaaaa)

---

