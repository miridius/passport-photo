<script lang="ts">
	import { loadImage } from '$lib/state/crop.svelte';

	let { compact = false }: { compact?: boolean } = $props();
	let error = $state('');

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			error = '';
			try {
				await loadImage(file);
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load image';
			}
		}
	}
</script>

<div class="photo-loader" class:compact>
	<label class="photo-loader-btn">
		{compact ? 'Change photo' : 'Select a photo'}
		<input type="file" accept="image/*" onchange={handleFileChange} />
	</label>
	{#if error}
		<p class="load-error">{error}</p>
	{/if}
</div>

<style>
	.photo-loader {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.photo-loader-btn {
		display: inline-block;
		padding: 0.75rem 1.75rem;
		font-size: 1.0625rem;
		font-weight: 600;
		color: #fff;
		background: #2563eb;
		border-radius: 0.625rem;
		cursor: pointer;
		transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
		box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
		letter-spacing: 0.01em;
	}

	.compact .photo-loader-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		background: #4b5563;
		border-radius: 0.375rem;
		box-shadow: none;
	}

	.photo-loader-btn:hover {
		background: #1d4ed8;
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
	}

	.photo-loader-btn:active {
		transform: translateY(1px);
	}

	.compact .photo-loader-btn:hover {
		background: #374151;
		box-shadow: none;
	}

	.photo-loader-btn input {
		display: none;
	}

	.load-error {
		margin: 0.5rem 0 0;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		color: #991b1b;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		text-align: center;
	}
</style>
