<script lang="ts">
	import { triggerDownload } from '$lib/canvas/export';

	let { blob, loading, onClose }: { blob: Blob | null; loading: boolean; onClose: () => void } = $props();

	let dialogEl: HTMLDialogElement;
	let previewUrl = $state('');

	$effect(() => {
		if (loading || blob) {
			dialogEl?.showModal();
		}
	});

	$effect(() => {
		if (blob) {
			previewUrl = URL.createObjectURL(blob);
			return () => {
				URL.revokeObjectURL(previewUrl);
				previewUrl = '';
			};
		} else {
			previewUrl = '';
		}
	});

	function handleClose() {
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			dialogEl.close();
		}
	}

	function download() {
		if (blob) {
			triggerDownload(blob, 'passphoto-print-sheet.jpg');
		}
		dialogEl.close();
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
			<button class="preview-btn preview-btn--cancel" onclick={() => dialogEl.close()}>Cancel</button>
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
