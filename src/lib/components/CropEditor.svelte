<script lang="ts">
	import { cropState, imageState, applyPan, applyZoom } from '$lib/state/crop.svelte';
	import { computeTransform, keyToAction } from './cropTransform';
	import { panZoom } from '$lib/actions/panZoom';
	import { chinGuide, crownGuide, AU_PASSPORT_SPEC } from '$lib/state/spec';
	import GuideOverlay from './GuideOverlay.svelte';

	// Ruler labels span 0-45mm (vertical) and 0-35mm (horizontal)
	const H = AU_PASSPORT_SPEC.photoHeightMm; // 45
	const W = AU_PASSPORT_SPEC.photoWidthMm; // 35

	// Guide positions in physical mm (within 45mm frame)
	const crownTopMm = crownGuide.topFrac * H;
	const crownBottomMm = crownGuide.bottomFrac * H;
	const chinTopMm = chinGuide.topFrac * H;
	const chinBottomMm = chinGuide.bottomFrac * H;

	const ticks = Array.from({ length: H + 1 }, (_, i) => i);
	const hTicks = Array.from({ length: W + 1 }, (_, i) => i);

	let frameWidth = $state(0);
	let frameEl: HTMLDivElement | undefined = $state();

	// Aspect ratio correction for Y-axis clamping
	const yScale = $derived(
		imageState.naturalWidth > 0 && imageState.naturalHeight > 0
			? (imageState.naturalWidth / imageState.naturalHeight) / AU_PASSPORT_SPEC.aspectRatio
			: 1,
	);

	const transform = $derived(
		imageState.naturalWidth > 0 && frameWidth > 0
			? computeTransform({
					offsetX: cropState.offsetX,
					offsetY: cropState.offsetY,
					zoomFraction: cropState.zoomFraction,
					imageNaturalWidth: imageState.naturalWidth,
					imageNaturalHeight: imageState.naturalHeight,
					frameWidth,
				})
			: { scaleFactor: 1, panXpx: 0, panYpx: 0 }
	);

	function onPan(dx: number, dy: number) {
		if (transform.scaleFactor === 0) return;
		const dxNorm = -dx / (imageState.naturalWidth * transform.scaleFactor);
		const dyNorm = -dy / (imageState.naturalHeight * transform.scaleFactor);
		Object.assign(cropState, applyPan(cropState, dxNorm, dyNorm, yScale));
	}

	function onZoom(factor: number, cx: number, cy: number) {
		if (!frameEl) return;
		const rect = frameEl.getBoundingClientRect();
		const centerXNorm = cx / rect.width;
		const centerYNorm = cy / rect.height;
		Object.assign(cropState, applyZoom(cropState, factor, centerXNorm, centerYNorm, yScale));
	}

	function onKeydown(e: KeyboardEvent) {
		const action = keyToAction(e.key);
		if (!action) return;

		const panStep = e.shiftKey ? 2 : 10;
		const zoomFactor = e.shiftKey ? 1.01 : 1.05;
		const frameHeight = frameWidth * (H / W);

		switch (action) {
			case 'panLeft':  onPan(-panStep, 0); break;
			case 'panRight': onPan(panStep, 0); break;
			case 'panUp':    onPan(0, -panStep); break;
			case 'panDown':  onPan(0, panStep); break;
			case 'zoomIn':   onZoom(1 / zoomFactor, frameWidth / 2, frameHeight / 2); break;
			case 'zoomOut':  onZoom(zoomFactor, frameWidth / 2, frameHeight / 2); break;
		}
		e.preventDefault();
	}
</script>

<div class="crop-workspace">
	<div class="frame-container">
		<!-- mm ruler — positioned from frame's coordinate space -->
		<div class="ruler" aria-hidden="true">
			{#each ticks as mm}
				<div
					class="tick"
					class:major={mm % 5 === 0}
					style="top: {(mm / H) * 100}%;"
				>
					{#if mm % 5 === 0}
						<span class="tick-label">{mm === 0 || mm === H ? `${mm}mm` : mm}</span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- crop frame — the photo viewport -->
		<div
			class="crop-frame"
			bind:this={frameEl}
			bind:clientWidth={frameWidth}
			use:panZoom={{ onPan, onZoom }}
			tabindex="0"
			role="application"
			aria-label="Crop editor: arrow keys to pan, +/- to zoom, Shift for precision"
			onkeydown={onKeydown}
		>
			{#if imageState.url}
				<img
					src={imageState.url}
					alt="Crop preview"
					draggable="false"
					class="crop-image"
					style="transform: translate({transform.panXpx}px, {transform.panYpx}px) scale({transform.scaleFactor}); transform-origin: 0 0;"
				/>
			{/if}
			<GuideOverlay />
		</div>

		<!-- dimension brackets — positioned from frame's coordinate space -->
		<div class="dims" aria-hidden="true">
			<!-- 32mm (close edges: crown bottom → chin top) -->
			<div
				class="dim dim-inner"
				style="top: {crownGuide.bottomFrac * 100}%; height: {(chinGuide.topFrac - crownGuide.bottomFrac) * 100}%;"
			>
				<div class="dim-bracket"></div>
				<span class="dim-label">{chinTopMm - crownBottomMm}mm</span>
			</div>
			<!-- 36mm (far edges: crown top → chin bottom) -->
			<div
				class="dim dim-outer"
				style="top: {crownGuide.topFrac * 100}%; height: {(chinGuide.bottomFrac - crownGuide.topFrac) * 100}%;"
			>
				<div class="dim-bracket"></div>
				<span class="dim-label">{chinBottomMm - crownTopMm}mm</span>
			</div>
		</div>
	</div>

	<!-- horizontal ruler — below frame container -->
	<div class="ruler-h" aria-hidden="true">
		{#each hTicks as mm}
			<div
				class="htick"
				class:major={mm % 5 === 0}
				style="left: {(mm / W) * 100}%;"
			>
				{#if mm % 5 === 0}
					<span class="htick-label">{mm === 0 || mm === W ? `${mm}mm` : mm}</span>
				{/if}
			</div>
		{/each}
	</div>

	<p class="kb-hint">
		NOTE: Hold shift for precision movements. Arrows/drag to pan. +/-/scroll to zoom.
	</p>
</div>

<style>
	/* ── workspace ── */
	.crop-workspace {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 60vh;
		padding: 1.5rem 1rem;
		background: #1a1a1e;
	}

	/* ── frame container: single coordinate space for ruler + frame + dims ── */
	.frame-container {
		position: relative;
	}

	/* ── crop frame ── */
	.crop-frame {
		position: relative;
		aspect-ratio: 35 / 45;
		max-height: 80vh;
		width: calc(80vh * 35 / 45);
		overflow: hidden;
		background: #000;
		outline: none;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
	}

	.crop-frame:focus-visible {
		outline: 2px solid rgba(96, 165, 250, 0.6);
		outline-offset: -2px;
	}

	.crop-image {
		display: block;
		user-select: none;
		-webkit-user-select: none;
		pointer-events: none;
	}

	/* ── ruler (left) — absolute within frame-container ── */
	.ruler {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 100%;
		width: 2rem;
	}

	.tick {
		position: absolute;
		right: 0;
		height: 0;
	}

	.tick::before {
		content: '';
		position: absolute;
		top: -0.5px;
		right: 0;
		height: 1px;
		width: 5px;
		background: rgba(255, 255, 255, 0.22);
	}

	.tick.major::before {
		width: 10px;
		background: rgba(255, 255, 255, 0.4);
	}

	.tick-label {
		position: absolute;
		right: 13px;
		top: -0.45em;
		font-size: 0.5625rem;
		font-family: 'SF Mono', 'Cascadia Mono', 'Menlo', 'Consolas', monospace;
		color: rgba(255, 255, 255, 0.45);
		font-variant-numeric: tabular-nums;
		line-height: 1;
		text-align: right;
	}

	/* ── horizontal ruler (bottom) ── */
	.ruler-h {
		width: calc(80vh * 35 / 45);
		max-width: 100%;
		height: 1.25rem;
		position: relative;
	}

	.htick {
		position: absolute;
		top: 0;
		width: 0;
	}

	.htick::before {
		content: '';
		position: absolute;
		top: 0;
		left: -0.5px;
		width: 1px;
		height: 5px;
		background: rgba(255, 255, 255, 0.22);
	}

	.htick.major::before {
		height: 10px;
		background: rgba(255, 255, 255, 0.4);
	}

	.htick-label {
		position: absolute;
		top: 10px;
		left: -0.5em;
		font-size: 0.5625rem;
		font-family: 'SF Mono', 'Cascadia Mono', 'Menlo', 'Consolas', monospace;
		color: rgba(255, 255, 255, 0.45);
		font-variant-numeric: tabular-nums;
		line-height: 1;
		text-align: center;
		white-space: nowrap;
	}

	/* ── dimension brackets (right) — absolute within frame-container ── */
	.dims {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 100%;
		width: 2.75rem;
	}

	.dim {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dim-inner {
		--connect-width: 0.75rem;
		left: 0.125rem;
		width: 1.25rem;
	}

	.dim-outer {
		--connect-width: 1.875rem;
		left: 1.25rem;
		width: 1.25rem;
	}

	.dim-bracket {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 1px;
		background: rgba(255, 255, 255, 0.2);
	}

	.dim-bracket::before,
	.dim-bracket::after {
		content: '';
		position: absolute;
		left: calc(-1 * var(--connect-width));
		width: calc(var(--connect-width) + 1px);
		height: 1px;
		background: rgba(255, 255, 255, 0.32);
	}

	.dim-bracket::before { top: -0.5px; }
	.dim-bracket::after { top: calc(100% - 0.5px); }

	.dim-label {
		position: relative;
		font-size: 0.5625rem;
		font-family: 'SF Mono', 'Cascadia Mono', 'Menlo', 'Consolas', monospace;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.6);
		background: #1a1a1e;
		padding: 1px 2px;
		border-radius: 2px;
		white-space: nowrap;
		writing-mode: vertical-lr;
		text-orientation: mixed;
	}

	/* ── keyboard hint ── */
	.kb-hint {
		margin: 0.5rem 0 0;
		font-size: 0.6875rem;
		color: rgba(255, 255, 255, 0.55);
		letter-spacing: 0.015em;
		line-height: 1.4;
		text-align: center;
		max-width: 28rem;
	}

	/* ── responsive ── */
	@media (max-width: 480px) {
		.ruler { width: 1.5rem; }
		.tick-label { font-size: 0.5rem; right: 10px; }
		.dims { width: 2rem; }
		.dim-outer { --connect-width: 1rem; left: 1rem; }
		.ruler-h { display: none; }
		.kb-hint { display: none; }
		.frame-container { max-width: calc(100vw - 5rem); }
	}
</style>
