<script lang="ts">
	import { TYPE_LABELS, type MediaTypeValue } from '#lib/media.ts';

	let {
		url,
		type,
		width = 56
	}: { url: string | null; type: MediaTypeValue; width?: number } = $props();

	let failed = $state(false);
</script>

<!-- Decorative: the title is always shown next to it. 2:3 poster ratio; falls back to a type label -->
<div class="cover" style:width="{width}px">
	{#if url && !failed}
		<img src={url} alt="" loading="lazy" onerror={() => (failed = true)} />
	{:else}
		<span aria-hidden="true">{TYPE_LABELS[type]}</span>
	{/if}
</div>

<style>
	.cover {
		flex: none;
		aspect-ratio: 2 / 3;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		overflow: hidden;
		display: grid;
		place-items: center;
		color: var(--muted);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
