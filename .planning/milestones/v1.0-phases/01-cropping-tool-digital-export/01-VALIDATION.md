---
phase: 1
slug: cropping-tool-digital-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (ships with SvelteKit) |
| **Config file** | `vite.config.ts` (vitest config section) — Wave 0 installs |
| **Quick run command** | `bun run test` |
| **Full suite command** | `bun run test -- --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run test`
- **After every plan wave:** Run `bun run test -- --run && bun run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| W0-01 | 00 | 0 | LOAD-01 | unit | `bun run test -- --run src/lib/state/crop.svelte.test.ts` | Wave 0 | pending |
| W0-02 | 00 | 0 | CROP-02 | unit | `bun run test -- --run src/lib/actions/panZoom.test.ts` | Wave 0 | pending |
| W0-03 | 00 | 0 | CROP-03 | unit | `bun run test -- --run src/lib/actions/panZoom.test.ts` | Wave 0 | pending |
| W0-04 | 00 | 0 | CROP-05 | unit | `bun run test -- --run src/lib/state/spec.test.ts` | Wave 0 | pending |
| W0-05 | 00 | 0 | CROP-06 | unit | `bun run test -- --run src/lib/state/spec.test.ts` | Wave 0 | pending |
| W0-06 | 00 | 0 | EXPD-01 | unit | `bun run test -- --run src/lib/canvas/export.test.ts` | Wave 0 | pending |
| W0-07 | 00 | 0 | EXPD-02 | unit | `bun run test -- --run src/lib/canvas/export.test.ts` | Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `vite.config.ts` — vitest configuration (add via `bunx sv add vitest` or manual config)
- [ ] `src/lib/state/spec.test.ts` — covers CROP-05, CROP-06 (guide band position math)
- [ ] `src/lib/actions/panZoom.test.ts` — covers CROP-02, CROP-03 (gesture delta calculations)
- [ ] `src/lib/canvas/export.test.ts` — covers EXPD-01, EXPD-02 (export dimensions, format, DPI)
- [ ] `src/lib/state/crop.svelte.test.ts` — covers LOAD-01 (image loading into crop state)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crop frame displays 35:45 aspect ratio | CROP-01 | CSS `aspect-ratio` is declarative — visual check | Inspect crop frame element, verify computed ratio ~0.778 |
| Overlay darkens outside crop frame | CROP-04 | CSS overlay — visual check | Load photo, verify darkened area surrounds crop frame |
| Crown hint visible | CROP-07 | UI text/icon — visual check | Load photo, verify hint text near crown guide |
| Spec panel shows requirements | INFO-01 | Static content — visual check | Open app, verify spec panel content matches AU requirements |
| Child notes visible | INFO-02 | Static content — visual check | Open app, verify child-specific notes are displayed |
| Desktop Chrome/Firefox | COMPAT-01 | Browser testing | Load app in Chrome and Firefox, test pan/zoom/export |
| Android Chrome | COMPAT-02 | Device testing | Load app on Android Chrome, test touch pan/pinch zoom/export |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
