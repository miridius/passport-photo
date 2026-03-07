<script lang="ts">
	import { chinGuide, crownGuide } from '$lib/state/spec';
</script>

<div class="guide-overlay">
	<!-- Crown band (3mm) -->
	<div
		class="guide-band crown"
		style="top: {crownGuide.topFrac * 100}%; height: {(crownGuide.bottomFrac - crownGuide.topFrac) * 100}%;"
	>
		<span class="guide-label">crown</span>
		<span class="crown-hint">top of skull, not hair</span>
	</div>

	<!-- Chin bar (1mm) -->
	<div
		class="guide-band chin"
		style="top: {chinGuide.topFrac * 100}%; height: {(chinGuide.bottomFrac - chinGuide.topFrac) * 100}%;"
	>
		<span class="guide-label">chin</span>
	</div>

	<!-- Vertical center line -->
	<div class="center-v"></div>
</div>

<style>
	.guide-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.guide-band {
		position: absolute;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0 0.375rem;
	}

	/* Top/bottom lines as pseudo-elements so they render downward from the
	   edge position (matching tick ::before rendering direction). CSS borders
	   with border-box render upward from the bottom edge, causing a 1px
	   visual offset vs ticks. */
	.guide-band::before,
	.guide-band::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--band-color);
	}

	.guide-band::before { top: -0.5px; }
	.guide-band::after { top: calc(100% - 0.5px); }

	.guide-band.crown {
		--band-color: rgba(59, 130, 246, 0.7);
		background: rgba(59, 130, 246, 0.15);
	}

	.guide-band.chin {
		--band-color: rgba(16, 185, 129, 0.7);
		background: rgba(16, 185, 129, 0.12);
	}

	.guide-label,
	.crown-hint {
		font-size: 0.5625rem;
		color: #fff;
		background: rgba(0, 0, 0, 0.55);
		padding: 1px 6px;
		border-radius: 3px;
		text-shadow:
			-1px -1px 0 rgba(0, 0, 0, 0.5),
			1px -1px 0 rgba(0, 0, 0, 0.5),
			-1px 1px 0 rgba(0, 0, 0, 0.5),
			1px 1px 0 rgba(0, 0, 0, 0.5);
	}

	.guide-label {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.crown-hint {
		font-weight: 400;
		font-style: italic;
		white-space: nowrap;
	}

	.center-v {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 0;
		border-left: 1px dashed rgba(255, 255, 255, 0.12);
	}
</style>
