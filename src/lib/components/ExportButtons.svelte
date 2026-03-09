<script lang="ts">
	import { onMount } from 'svelte';
	import { exportCrop, exportDigitalWithQualitySearch, triggerDownload } from '$lib/canvas/export';
	import { calculateSheetLayout, renderPrintSheet } from '$lib/canvas/printSheet';
	import { cropState, imageState } from '$lib/state/crop.svelte';
	import { AU_PASSPORT_SPEC } from '$lib/state/spec';
	import PrintPreview from './PrintPreview.svelte';

	let exporting = $state<'print' | 'digital' | 'sheet' | null>(null);
	let exportError = $state('');
	let sheetBlob = $state<Blob | null>(null);
	let sheetLoading = $state(false);

	const hasImage = $derived(imageState.loaded);

	onMount(() => {
		if (location.hash === '#print-sheet') {
			if (imageState.loaded) {
				downloadPrintSheet();
			} else {
				history.replaceState(null, '', location.pathname + location.search);
			}
		}
	});

	const { aspectRatio } = AU_PASSPORT_SPEC;
	const printWidthPx = $derived(Math.round(cropState.zoomFraction * imageState.naturalWidth));
	const printHeightPx = $derived(Math.round(printWidthPx / aspectRatio));
	const digitalWidthPx = $derived(Math.min(printWidthPx, AU_PASSPORT_SPEC.digitalExport.widthPx));
	const digitalHeightPx = $derived(Math.round(digitalWidthPx / aspectRatio));

	async function downloadPrint() {
		if (!imageState.loaded) return;
		exporting = 'print';
		exportError = '';
		try {
			const blob = await exportCrop(imageState.element, cropState, {
				widthPx: printWidthPx, heightPx: printHeightPx, dpi: 300, format: 'jpeg', quality: 1.0,
			});
			triggerDownload(blob, 'passphoto-print.jpg');
		} catch (e) {
			exportError = e instanceof Error ? e.message : 'Print export failed';
		} finally {
			exporting = null;
		}
	}

	/**
	 * Digital export with binary search quality auto-adjust.
	 * Starts at quality 1.0. If blob > 3.5MB, binary search reduces quality.
	 * If blob < 70KB at quality 1.0, source is too small — block export.
	 */
	async function downloadDigital() {
		if (!imageState.loaded) return;
		exporting = 'digital';
		exportError = '';
		try {
			const result = await exportDigitalWithQualitySearch(
				imageState.element, cropState,
				digitalWidthPx, digitalHeightPx,
				AU_PASSPORT_SPEC.digitalExport,
			);
			if ('error' in result) {
				exportError = result.error;
			} else {
				triggerDownload(result.blob, 'passphoto-digital.jpg');
			}
		} catch (e) {
			exportError = e instanceof Error ? e.message : 'Digital export failed';
		} finally {
			exporting = null;
		}
	}

	async function downloadPrintSheet() {
		if (!imageState.loaded) return;
		exporting = 'sheet';
		exportError = '';
		sheetBlob = null;
		sheetLoading = true;
		history.replaceState(null, '', '#print-sheet');
		try {
			const layout = calculateSheetLayout();
			sheetBlob = await renderPrintSheet(imageState.element, cropState, layout);
		} catch (e) {
			exportError = e instanceof Error ? e.message : 'Failed to generate print sheet';
		} finally {
			exporting = null;
			sheetLoading = false;
		}
	}

	function closePreview() {
		sheetBlob = null;
		sheetLoading = false;
		if (location.hash === '#print-sheet') {
			history.replaceState(null, '', location.pathname + location.search);
		}
	}
</script>

<div class="export-buttons">
	<button
		class="export-btn export-btn--print"
		disabled={!hasImage || exporting !== null}
		onclick={downloadPrint}
	>
		{exporting === 'print' ? 'Exporting...' : `Download Print (${printWidthPx}\u00d7${printHeightPx})`}
	</button>
	<button
		class="export-btn export-btn--digital"
		disabled={!hasImage || exporting !== null}
		onclick={downloadDigital}
	>
		{exporting === 'digital' ? 'Exporting...' : `Download Digital (${digitalWidthPx}\u00d7${digitalHeightPx})`}
	</button>
	<button
		class="export-btn export-btn--sheet"
		disabled={!hasImage || exporting !== null}
		onclick={downloadPrintSheet}
	>
		{exporting === 'sheet' ? 'Generating...' : 'Download Print Sheet'}
	</button>
	{#if exportError}
		<p class="export-error">{exportError}</p>
	{/if}
</div>

<PrintPreview blob={sheetBlob} loading={sheetLoading} onClose={closePreview} />

<style>
	.export-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0;
	}

	.export-btn {
		min-height: 44px;
		min-width: 44px;
		padding: 0.625rem 1.25rem;
		font-size: 0.8125rem;
		font-weight: 600;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		color: #fff;
		transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
		letter-spacing: 0.01em;
	}

	.export-btn:not(:disabled):active {
		transform: translateY(1px);
	}

	.export-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.export-btn--print {
		background: #2563eb;
		box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
	}

	.export-btn--print:not(:disabled):hover {
		background: #1d4ed8;
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
	}

	.export-btn--print:not(:disabled):active {
		background: #1e40af;
	}

	.export-btn--digital {
		background: #059669;
		box-shadow: 0 1px 3px rgba(5, 150, 105, 0.25);
	}

	.export-btn--digital:not(:disabled):hover {
		background: #047857;
		box-shadow: 0 2px 6px rgba(5, 150, 105, 0.35);
	}

	.export-btn--digital:not(:disabled):active {
		background: #065f46;
	}

	.export-btn--sheet {
		background: #7c3aed;
		box-shadow: 0 1px 3px rgba(124, 58, 237, 0.25);
	}

	.export-btn--sheet:not(:disabled):hover {
		background: #6d28d9;
		box-shadow: 0 2px 6px rgba(124, 58, 237, 0.35);
	}

	.export-btn--sheet:not(:disabled):active {
		background: #5b21b6;
	}

	.export-error {
		width: 100%;
		margin: 0.25rem 0 0;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		color: #991b1b;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		text-align: center;
	}
</style>
