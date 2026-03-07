<script lang="ts">
	import { triggerDownload } from '$lib/canvas/export';

	let dialogEl: HTMLDialogElement;
	let previewUrl = $state('');
	let loading = $state(false);
	let currentBlob: Blob | null = null;

	export function showLoading() {
		loading = true;
		previewUrl = '';
		currentBlob = null;
		dialogEl.showModal();
	}

	export function show(blob: Blob) {
		currentBlob = blob;
		loading = false;
		previewUrl = URL.createObjectURL(blob);
		if (!dialogEl.open) dialogEl.showModal();
	}

	function close() {
		dialogEl.close();
	}

	function handleClose() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = '';
		}
		currentBlob = null;
		if (location.hash === '#print-sheet') {
			history.replaceState(null, '', location.pathname + location.search);
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			close();
		}
	}

	function download() {
		if (currentBlob) {
			triggerDownload(currentBlob, 'passphoto-print-sheet.jpg');
		}
		close();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialogEl} onclose={handleClose} onclick={handleBackdropClick}>
	<div class="preview-content">
		{#if loading}
			<p class="generating">Generating print sheet…</p>
		{:else if previewUrl}
			<img src={previewUrl} alt="Print sheet preview" />
		{/if}
		<div class="preview-actions">
			<button class="preview-btn preview-btn--download" disabled={loading} onclick={download}>Download</button>
			<button class="preview-btn preview-btn--cancel" onclick={close}>Cancel</button>
		</div>
	</div>
</dialog>

<style>
	dialog {
		border: none;
		border-radius: 0.75rem;
		padding: 0;
		max-width: 90vw;
		max-height: 90vh;
		background: #fff;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.6);
	}

	.preview-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem;
		gap: 1rem;
	}

	.preview-content img {
		max-width: 85vw;
		max-height: 70vh;
		object-fit: contain;
		border-radius: 0.25rem;
		border: 1px solid #e5e7eb;
	}

	.preview-actions {
		display: flex;
		gap: 0.75rem;
	}

	.preview-btn {
		min-height: 44px;
		min-width: 44px;
		padding: 0.625rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.preview-btn--download {
		background: #2563eb;
		color: #fff;
	}

	.preview-btn--download:hover {
		background: #1d4ed8;
	}

	.preview-btn--cancel {
		background: #e5e7eb;
		color: #374151;
	}

	.preview-btn--cancel:hover {
		background: #d1d5db;
	}

	.generating {
		padding: 3rem 4rem;
		color: #6b7280;
		font-size: 0.9375rem;
	}
</style>
