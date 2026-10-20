<script lang="ts">
	import Cover from '#lib/components/Cover.svelte';
	import { LENGTH_FILTERS, filtersQuery } from '#lib/filters.ts';
	import { TYPE_LABELS, creatorLabel, formatLength } from '#lib/media.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let pick = $derived(data.pick);

	// Links keep the same filters; the list link restores the default status view
	let listHref = $derived(`/${filtersQuery({ ...data.filters, status: 'active' })}`);
	let rerollHref = $derived(
		`/pick${filtersQuery({ ...data.filters, status: 'active' }, pick ? { not: pick.id } : {})}`
	);

	let filterSummary = $derived(
		[
			data.filters.type && TYPE_LABELS[data.filters.type],
			data.filters.length && LENGTH_FILTERS[data.filters.length].label,
			data.filters.q && `“${data.filters.q}”`
		].filter(Boolean)
	);
</script>

<svelte:head>
	<title>Surprise me · Media Shelf</title>
</svelte:head>

<a class="back" href={listHref}>← List</a>

<p class="scope">
	From {data.total} “Want to”
	{data.total === 1 ? 'item' : 'items'}{#if filterSummary.length}: {filterSummary.join(' · ')}{/if}
</p>

{#if pick}
	<article class="card" aria-live="polite">
		<Cover url={pick.coverUrl} type={pick.type} width={120} />
		<div class="details">
			<h1>{pick.title}</h1>
			<p class="meta">
				{[TYPE_LABELS[pick.type], pick.year, formatLength(pick.type, pick.length)]
					.filter(Boolean)
					.join(' · ')}
			</p>
			{#if pick.creator}
				<p class="meta">{creatorLabel(pick.type)}: {pick.creator}</p>
			{/if}
			{#if pick.genres.length}
				<p class="meta">{pick.genres.join(', ')}</p>
			{/if}
			{#if pick.heardFrom}
				<p class="meta">Heard from {pick.heardFrom}</p>
			{/if}
		</div>
		{#if pick.overview}
			<p class="overview">{pick.overview}</p>
		{/if}
	</article>

	<div class="actions">
		<form method="POST" action="?/start">
			<input type="hidden" name="id" value={pick.id} />
			<button class="button primary">Start it</button>
		</form>
		<a class="button" href={rerollHref} data-sveltekit-replacestate data-sveltekit-reset="false">
			{data.total > 1 ? 'Reroll' : 'Only one match'}
		</a>
		<a class="button" href="/items/{pick.id}">Open</a>
	</div>
{:else}
	<div class="empty">
		<p>No “Want to” items match these filters.</p>
		<a class="button" href="/pick">Pick from everything</a>
	</div>
{/if}

<style>
	.back {
		display: inline-block;
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
		text-decoration: none;
	}
	.scope {
		margin: 0 0 var(--space-4);
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.card {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	h1 {
		font-size: var(--text-lg);
		margin-bottom: var(--space-2);
	}
	.meta {
		margin: 0 0 var(--space-1);
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.overview {
		grid-column: 1 / -1;
		margin: 0;
		font-size: var(--text-sm);
		display: -webkit-box;
		-webkit-line-clamp: 6;
		line-clamp: 6;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.actions {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: var(--space-2);
		margin-top: var(--space-4);
	}
	.actions form,
	.actions form .button {
		width: 100%;
	}
	.empty {
		text-align: center;
		padding: var(--space-6) 0;
		color: var(--muted);
	}
</style>
