---
status: investigating
trigger: "Investigate why the horizontal ruler below the crop frame is not working/visible"
created: 2026-03-08T00:00:00Z
updated: 2026-03-08T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - ruler-h has zero intrinsic width because all children are absolutely positioned, and the parent flex column uses align-items:center (not stretch)
test: Static CSS analysis of layout model
expecting: ruler-h collapses to zero width, all ticks render at left:0
next_action: Document root cause

## Symptoms

expected: Below the crop frame, a horizontal mm ruler shows 0mm-35mm scale with tick marks
actual: Horizontal ruler is not visible
errors: None reported
reproduction: Load the crop editor
started: Since implementation in 01-06

## Eliminated

## Evidence

- timestamp: 2026-03-08
  checked: DOM structure and CSS layout model
  found: .ruler-h is a direct child of .crop-workspace (flex column, align-items:center). It has no explicit width. All its children (.htick) are position:absolute and don't contribute to intrinsic size. Result is zero-width container.
  implication: All ticks positioned at left:{pct}% resolve to 0px. The border-top line and tick marks all collapse to a point.

- timestamp: 2026-03-08
  checked: Why vertical ruler works but horizontal doesn't
  found: Vertical ruler (.ruler) is inside .crop-assembly (flex row, align-items:stretch) with explicit width:2rem. Its HEIGHT comes from flex stretch matching the crop-frame. Horizontal ruler gets no such width inheritance.
  implication: The two rulers use fundamentally different sizing strategies. Vertical gets height from flex stretch; horizontal has no mechanism to get width.

- timestamp: 2026-03-08
  checked: margin-left/margin-right alignment approach
  found: ruler-h uses margin-left:2rem and margin-right:3.5rem to try to align with the crop frame (accounting for the left ruler width and right dims width). But without a width, these margins have nothing to apply to.
  implication: Even if width were set, this margin approach is fragile - it depends on matching the exact widths of sibling elements in a different flex container.

## Resolution

root_cause: .ruler-h has zero intrinsic width. It's a child of a flex-column container with align-items:center. All its children are absolutely positioned (position:absolute), so they don't contribute to the parent's intrinsic size. The percentage-based left positioning (left:{(mm/W)*100}%) computes against a zero-width container, placing all ticks at 0px. The ruler effectively collapses to an invisible point.
fix:
verification:
files_changed: []
