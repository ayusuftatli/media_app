<script lang="ts" module>
	// Muted tints for covers without art, picked from the title so an item keeps its colour
	const TINTS = [
		['#2e4a5c', '#f4f1ea'],
		['#4e6b3a', '#f2f4ec'],
		['#3f7c85', '#f2f1ed'],
		['#6b2e2a', '#f6e9e4'],
		['#5a4a7a', '#f1edf8'],
		['#8a5a2b', '#fbf1e6'],
		['#3d5a80', '#eef3fa'],
		['#5c5c3d', '#f5f5ea']
	] as const;

	export function coverTint(title: string) {
		let hash = 0;
		for (const char of title) hash = (hash * 31 + char.codePointAt(0)!) | 0;
		return TINTS[Math.abs(hash) % TINTS.length];
	}
</script>

<script lang="ts">
	import { TYPE_LABELS, type MediaTypeValue } from '#lib/media.ts';

	let {
		url,
		type,
		title = '',
		width = 56
	}: {
		url: string | null;
		type: MediaTypeValue;
		title?: string;
		// Pixels, or 'fill' to take the width of the parent (poster grid)
		width?: number | 'fill';
	} = $props();

	let failed = $state(false);
	let [tint, ink] = $derived(coverTint(title || type));
	// Small thumbnails can't fit a readable title, so they show just the tint
	let showTitle = $derived(width === 'fill' || width >= 96);

	// Catches images that failed before hydration, when onerror wasn't attached yet
	function checkLoaded(img: HTMLImageElement) {
		if (img.complete && img.naturalWidth === 0) failed = true;
	}
</script>

<!-- Decorative: the title is always shown next to it. 2:3 poster ratio; falls back to a tinted card -->
<div
	class="cover"
	class:large={width === 'fill' || width >= 96}
	style:width={width === 'fill' ? '100%' : `${width}px`}
	style:--tint={tint}
	style:--ink={ink}
>
	{#if url && !failed}
		<img src={url} alt="" loading="lazy" onerror={() => (failed = true)} use:checkLoaded />
	{:else if showTitle && title}
		<span class="fallback" aria-hidden="true">
			<small>{TYPE_LABELS[type]}</small>
			{title}
		</span>
	{/if}
</div>

<style>
	.cover {
		flex: none;
		aspect-ratio: 2 / 3;
		border-radius: 8px;
		background: var(--tint);
		color: var(--ink);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.06);
	}
	.cover.large {
		border-radius: 10px;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.fallback {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px;
		font-size: 0.8rem;
		font-weight: 800;
		line-height: 1.15;
		overflow-wrap: anywhere;
	}
	.fallback small {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.8;
	}
</style>
