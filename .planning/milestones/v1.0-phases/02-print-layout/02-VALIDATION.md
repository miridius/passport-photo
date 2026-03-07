---
phase: 02
slug: print-layout
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (unit), Playwright 1.58.x (E2E) |
| **Config file** | vite.config (Vitest), playwright.config.ts |
| **Quick run command** | `bun vitest run` |
| **Full suite command** | `bun vitest run && bun playwright test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun vitest run`
- **After every plan wave:** Run `bun vitest run && bun playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | EXPP-01 | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | EXPP-01 | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | EXPP-02 | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | EXPP-03 | unit | `bun vitest run src/lib/canvas/printSheet.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | -- | unit | `bun vitest run src/lib/state/spec.test.ts` | ✅ (update) | ⬜ pending |
| 02-03-01 | 03 | 2 | EXPP-01 | E2E | `bun playwright test` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | EXPP-01 | E2E | `bun playwright test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/canvas/printSheet.test.ts` — stubs for EXPP-01/02/03 layout math, cut marks, DPI
- [ ] E2E test additions in `e2e/passphoto.test.ts` — print sheet button, preview modal, download
- [ ] Update `src/lib/state/spec.test.ts` — new sheet constants and 36×46mm crop frame

*Existing infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Print sheet physical accuracy at DM | EXPP-01 | Requires physical printing | Print sheet at DM, measure with ruler |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
