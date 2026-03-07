# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-09
**Phases:** 2 | **Plans:** 21
**Timeline:** 3 days (2026-03-07 → 2026-03-09)

### What Was Built
- Full crop editor with pan/zoom (mouse, touch, keyboard), guide bands, rulers, dimension brackets
- Dual export: native-resolution print JPEG + quality-auto-adjusted digital JPEG
- 9x13cm print sheet with 4-up tiling, cut marks, buffer zones, preview modal
- 75 unit tests + 69 E2E tests

### What Worked
- TDD for pure layout/geometry functions (printSheet.ts) caught margin calculation errors early
- Extracting pure functions (computeTransform, calculateSourceRect, expandSourceRect) made complex canvas logic testable without DOM
- CSS Grid for structural alignment eliminated fragile margin hacks
- Playwright NixOS lib-path script unblocked E2E testing

### What Was Inefficient
- Guide band alignment bugs (CSS border-box rendering direction) took multiple rounds to diagnose — screenshot-based testing couldn't catch sub-pixel alignment issues
- Print sheet went through 3 iterations: wrong dimensions (source-dependent DPI), wrong text sizing, wrong text wording — checking output earlier would have caught these faster
- HMR state persistence required 3 attempts (window global, sessionStorage, import.meta.hot) before landing on a working approach
- Cut marks were redesigned twice (stroked L-paths → 0.5mm fillRect → 2mm fillRect)

### Patterns Established
- Pseudo-elements over CSS borders for sub-pixel-aligned edge lines
- Fixed DPI constants for print output (don't derive from source resolution)
- URL hash for modal state persistence across HMR
- `expandSourceRect()` pattern for adding buffer zones to crops
- Vite watcher exclusions for `.svelte-kit/` and `build/` to prevent test-triggered HMR

### Key Lessons
1. Check your own output before presenting — generating a JPEG and measuring its dimensions would have caught the DPI bug immediately
2. `getBoundingClientRect()` reports box edges, not rendered pixel positions — structural E2E tests (checking CSS properties) catch alignment bugs that visual tests miss
3. For canvas geometry, write the test assertions from the spec math, not from what the code produces

### Cost Observations
- Model mix: ~80% opus, ~20% sonnet (subagents)
- Notable: Gap closure plans (UAT → fix cycles) were the majority of plans (10/21) — initial implementation rarely matches user expectations on first pass

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 2 | 21 | Initial project — established TDD, E2E, and UAT patterns |

### Cumulative Quality

| Milestone | Unit Tests | E2E Tests | LOC |
|-----------|-----------|-----------|-----|
| v1.0 | 75 | 69 | 3,151 |

### Top Lessons (Verified Across Milestones)

1. Always verify output artifacts (images, files) before presenting to user
2. Pure functions for geometry/layout math — testable without DOM
3. Gap closure is the majority of work — plan for it
