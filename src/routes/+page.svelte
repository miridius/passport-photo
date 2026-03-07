<script lang="ts">
	import { imageState } from '$lib/state/crop.svelte';
	import PhotoLoader from '$lib/components/PhotoLoader.svelte';
	import CropEditor from '$lib/components/CropEditor.svelte';
	import ExportButtons from '$lib/components/ExportButtons.svelte';
	import SpecPanel from '$lib/components/SpecPanel.svelte';
</script>

<svelte:head>
	<title>Dave's passport photo cropping tool</title>
</svelte:head>

{#if imageState.element}
	<header class="app-header">
		<h1>🇦🇺 Dave's passport photo cropping tool</h1>
		<PhotoLoader compact />
	</header>
	<main class="app-layout">
		<div class="editor-column">
			<CropEditor />
		</div>
		<div class="spec-column">
			<ExportButtons />
			<SpecPanel />
		</div>
	</main>
{:else}
	<main class="landing">
		<h1>🇦🇺 Dave's passport photo cropping tool</h1>
		<p>Crop and export photos to Australian passport spec. Guides show correct face position. Works offline, nothing uploaded.</p>
		<PhotoLoader />
	</main>
{/if}

<style>
	.app-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1.25rem;
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.app-header h1 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #111827;
	}

	.app-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
		min-height: calc(100vh - 45px);
	}

	.editor-column {
		min-width: 0;
	}

	.spec-column {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
		padding: 1rem 1.25rem;
		background: #fff;
	}

	.landing {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 0 1.5rem;
		text-align: center;
		background: linear-gradient(180deg, #fff 0%, #f8f9fa 100%);
	}

	.landing h1 {
		margin: 0 0 0.5rem;
		font-size: 2.25rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: #111827;
	}

	.landing p {
		color: #6b7280;
		font-size: 1.0625rem;
		margin: 0 0 2.5rem;
		line-height: 1.5;
	}

	@media (min-width: 960px) {
		.app-layout {
			grid-template-columns: 1fr 340px;
		}
	}
</style>
