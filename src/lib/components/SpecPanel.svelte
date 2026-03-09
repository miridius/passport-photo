<script lang="ts">
	import { AU_PASSPORT_SPEC } from '$lib/state/spec';
</script>

<aside class="spec-panel">
	<h2>Australian Passport Photo</h2>

	<dl class="spec-list">
		<dt>Photo size</dt>
		<dd>{AU_PASSPORT_SPEC.photoWidthMinMm}&ndash;{AU_PASSPORT_SPEC.photoWidthMaxMm}mm &times; {AU_PASSPORT_SPEC.photoHeightMinMm}&ndash;{AU_PASSPORT_SPEC.photoHeightMaxMm}mm</dd>

		<dt>Face size (chin to crown)</dt>
		<dd>
			{AU_PASSPORT_SPEC.faceHeightMinMm}&ndash;{AU_PASSPORT_SPEC.faceHeightMaxMm}mm
			({Math.round(AU_PASSPORT_SPEC.faceHeightMinFrac * 100)}&ndash;{Math.round(AU_PASSPORT_SPEC.faceHeightMaxFrac * 100)}% of photo height)
		</dd>

		<dt>Position</dt>
		<dd>Head centered, face looking directly at camera</dd>

		<dt>Background</dt>
		<dd>Plain white or light grey</dd>

		<dt>Expression</dt>
		<dd>Neutral, mouth closed</dd>

		<dt>Eyes</dt>
		<dd>Open, clearly visible</dd>
	</dl>

	<details class="child-rules" open>
		<summary>Child-specific rules</summary>
		<div class="child-rules-content">
			<h3>Under 3 years</h3>
			<ul>
				<li>Mouth may be open</li>
				<li>No toys or objects in photo</li>
				<li>No other people visible in photo</li>
			</ul>
			<h3>3 years and older</h3>
			<ul>
				<li>Same requirements as adults</li>
				<li>No other people visible in photo</li>
			</ul>
		</div>
	</details>

	<p class="spec-source">Source: <a href="https://www.passports.gov.au/help/passport-photos" target="_blank" rel="noopener">passports.gov.au</a></p>
</aside>

<style>
	.spec-panel {
		padding: 1.25rem 1.5rem;
		background: #f8f9fa;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.6;
		color: #1a1a1a;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: #111827;
	}

	.spec-list {
		margin: 0 0 1rem;
	}

	.spec-list dt {
		font-weight: 600;
		margin-top: 0.625rem;
		font-size: 0.8125rem;
		color: #374151;
	}

	.spec-list dt:first-child {
		margin-top: 0;
	}

	.spec-list dd {
		margin: 0.125rem 0 0;
		padding: 0;
		color: #6b7280;
		font-size: 0.8125rem;
	}

	.child-rules {
		margin: 0.75rem 0;
		padding: 0.75rem 1rem;
		background: #fffbeb;
		border-radius: 0.5rem;
		border: 1px solid #fde68a;
	}

	.child-rules summary {
		font-weight: 600;
		font-size: 0.8125rem;
		cursor: pointer;
		color: #92400e;
	}

	.child-rules-content {
		margin-top: 0.5rem;
		font-size: 0.8125rem;
	}

	.child-rules h3 {
		margin: 0.5rem 0 0.25rem;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.child-rules ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	.child-rules li {
		margin: 0.125rem 0;
	}


	.spec-source {
		margin: 0.75rem 0 0;
		padding-top: 0.75rem;
		border-top: 1px solid #e5e7eb;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.spec-source a {
		color: #6b7280;
		text-decoration: none;
	}

	.spec-source a:hover {
		color: #374151;
		text-decoration: underline;
	}
</style>
