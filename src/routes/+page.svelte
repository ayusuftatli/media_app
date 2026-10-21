<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Cover from '#lib/components/Cover.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import {
		LENGTH_FILTERS,
		STATUS_FILTERS,
		filtersQuery,
		hasActiveFilters,
		lengthOptionsFor,
		parseFilters
	} from '#lib/filters.ts';
	import { MEDIA_TYPES, TYPE_LABELS, formatLength } from '#lib/media.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let filters = $derived(data.filters);
	let filtered = $derived(hasActiveFilters(filters));

	let form = $state<HTMLFormElement>();
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	// Rebuild the URL from the form, leaving out defaults; works as a plain GET form without JS
	function apply(event?: SubmitEvent) {
		event?.preventDefault();
		if (!form) return;
		const params = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
		// replace: filter tweaks shouldn't pile up in history; reset: false keeps focus and scroll
		goto(`${page.url.pathname}${filtersQuery(parseFilters(params))}`, {
			replace: true,
			reset: false
		});
	}

	function applySoon() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(apply, 250);
	}

	// Search and length live behind the search button; open when they're in use
	let toolsOpen = $state(false);
	$effect.pre(() => {
		if (filters.q || filters.length) toolsOpen = true;
	});
	let searchInput = $state<HTMLInputElement>();
	async function toggleTools() {
		toolsOpen = !toolsOpen;
		if (toolsOpen) {
			await tick();
			searchInput?.focus();
		}
	}

	// "Up next" splits into what's under way (a row on top) and what's waiting (the grid)
	let upNext = $derived(filters.status === 'active');
	let continuing = $derived(upNext ? data.items.filter((i) => i.status === 'in_progress') : []);
	let shelf = $derived(upNext ? data.items.filter((i) => i.status !== 'in_progress') : data.items);
	let shelfHeading = $derived(upNext ? 'Want to' : STATUS_FILTERS[filters.status]);

	const TYPE_TABS = { movie: 'Movies', tv: 'TV', book: 'Books' } as const;

	type Item = (typeof data.items)[number];
	function progressLabel(item: Item) {
		if (item.type === 'tv') return item.currentSeason ? `Season ${item.currentSeason}` : 'Watching';
		return item.type === 'book' ? 'Reading' : 'Watching';
	}
	function posterMeta(item: Item) {
		if (item.status === 'finished' && item.rating) return `★ ${item.rating}`;
		if (item.status === 'in_progress') return progressLabel(item);
		if (item.status === 'dropped') return 'Dropped';
		return [item.year, formatLength(item.type, item.length) ?? TYPE_LABELS[item.type]]
			.filter(Boolean)
			.join(' · ');
	}

	// Pick always draws from "Want to", so the status filter isn't passed along
	let pickHref = $derived(`/pick${filtersQuery({ ...filters, status: 'active' })}`);
</script>

<svelte:head>
	<title>Media Shelf</title>
	<!-- Without JS the search button can't open the search row, so always show it -->
	<noscript><style>[data-tools] { display: grid !important; }</style></noscript>
</svelte:head>

<form class="filters" method="GET" bind:this={form} onsubmit={apply}>
	<header class="top">
		<h1><a href="/">Media Shelf</a></h1>
		<div class="top-actions">
			<button
				type="button"
				class="icon-button"
				aria-label="Search and filters"
				aria-expanded={toolsOpen}
				aria-controls="tools"
				onclick={toggleTools}
			>
				<Icon name="search" />
			</button>
			<a class="button primary surprise" href={pickHref}>
				<Icon name="shuffle" size={18} stroke={2.25} />Surprise me
			</a>
		</div>
	</header>

	<div id="tools" class="tools" class:open={toolsOpen} data-tools>
		<label for="q" class="visually-hidden">Search my list</label>
		<input
			id="q"
			name="q"
			type="search"
			placeholder="Search my list"
			value={filters.q}
			autocomplete="off"
			enterkeyhint="search"
			bind:this={searchInput}
			oninput={applySoon}
		/>
		{#if lengthOptionsFor(filters.type).length > 0}
			<div>
				<label for="length" class="visually-hidden">Length</label>
				<select id="length" name="length" value={filters.length ?? ''} onchange={() => apply()}>
					<option value="">Any length</option>
					{#each lengthOptionsFor(filters.type) as value (value)}
						<option {value}>{LENGTH_FILTERS[value].label}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	<div class="tab-row">
		<fieldset class="type-tabs">
			<legend class="visually-hidden">Type</legend>
			<label>
				<input type="radio" name="type" value="" checked={!filters.type} onchange={() => apply()} />
				<span>All</span>
			</label>
			{#each MEDIA_TYPES as option (option)}
				<label>
					<input
						type="radio"
						name="type"
						value={option}
						checked={filters.type === option}
						onchange={() => apply()}
					/>
					<span>{TYPE_TABS[option]}</span>
				</label>
			{/each}
		</fieldset>

		<div class="status">
			<label for="status" class="visually-hidden">Show</label>
			<select id="status" name="status" value={filters.status} onchange={() => apply()}>
				{#each Object.entries(STATUS_FILTERS) as [value, label] (value)}
					<option {value}>{label}</option>
				{/each}
			</select>
		</div>
	</div>

	<noscript><button class="button">Apply</button></noscript>
</form>

<p class="visually-hidden" aria-live="polite">
	{data.items.length}
	{data.items.length === 1 ? 'item' : 'items'}
</p>

{#if data.items.length === 0}
	<div class="empty">
		{#if filtered}
			<p>Nothing matches these filters.</p>
			<a class="button" href="/">Clear filters</a>
		{:else}
			<p>Nothing waiting. Add something to get started.</p>
			<a class="button primary" href="/add">Add something</a>
		{/if}
	</div>
{:else}
	{#if continuing.length > 0}
		<section class="continue" aria-labelledby="continue-heading">
			<h2 id="continue-heading">Continue</h2>
			<ul>
				{#each continuing as item (item.id)}
					<li>
						<a href="/items/{item.id}">
							<Cover url={item.coverUrl} type={item.type} title={item.title} width={60} />
							<span class="continue-text">
								<span class="title">{item.title}</span>
								<span class="meta">
									{[TYPE_LABELS[item.type], item.creator].filter(Boolean).join(' · ')}
								</span>
								<span class="progress">{progressLabel(item)}</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if shelf.length > 0}
		<section aria-labelledby="shelf-heading">
			<div class="section-head">
				<h2 id="shelf-heading">{shelfHeading} <span>· {shelf.length}</span></h2>
				{#if filtered}<a href="/">Clear filters</a>{/if}
			</div>
			<ul class="grid">
				{#each shelf as item (item.id)}
					<li>
						<a href="/items/{item.id}">
							<Cover url={item.coverUrl} type={item.type} title={item.title} width="fill" />
							<span class="poster-title">{item.title}</span>
							<span class="poster-meta">{posterMeta(item)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}

<style>
	.filters {
		display: grid;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}
	h1 {
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}
	h1 a {
		color: var(--text);
		text-decoration: none;
	}
	.top-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.surprise {
		min-height: 2.75rem;
		border-radius: 999px;
		white-space: nowrap;
	}
	.tools {
		display: none;
		gap: var(--space-2);
	}
	.tools.open {
		display: grid;
	}
	.tab-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		border-bottom: 1px solid var(--border);
	}
	.type-tabs {
		display: flex;
		gap: 1.125rem;
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	.type-tabs label {
		margin: 0;
		color: var(--muted);
		font-size: 0.9375rem;
		font-weight: 600;
	}
	.type-tabs input {
		position: absolute;
		opacity: 0;
	}
	.type-tabs span {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		cursor: pointer;
	}
	.type-tabs input:checked + span {
		color: var(--text);
		font-weight: 800;
		border-bottom-color: var(--accent);
	}
	.type-tabs input:focus-visible + span {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	/* Looks like a text button; still a native select so phones show their own picker */
	.status select {
		width: auto;
		/* Size to the chosen option, not the longest one */
		field-sizing: content;
		min-height: 2.75rem;
		padding: 0 1.5rem 0 0;
		border: 0;
		background-color: transparent;
		background-position: right 0 center;
		color: var(--muted);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	h2 {
		font-size: 1.125rem;
		font-weight: 800;
	}
	h2 span {
		color: var(--muted);
		font-weight: 600;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.continue {
		margin-bottom: var(--space-5);
	}
	.continue h2 {
		margin-bottom: var(--space-3);
	}
	/* Sideways-scrolling row that runs to the screen edge */
	.continue ul {
		display: flex;
		gap: var(--space-3);
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		margin-inline: calc(-1 * var(--gutter));
		padding: 0 var(--gutter) var(--space-1);
		scroll-padding-inline: var(--gutter);
		scrollbar-width: none;
	}
	.continue li {
		flex: none;
		width: min(17rem, 78vw);
		scroll-snap-align: start;
	}
	.continue a {
		display: flex;
		gap: var(--space-3);
		height: 100%;
		box-sizing: border-box;
		padding: var(--space-3);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: inherit;
		text-decoration: none;
	}
	.continue a:hover {
		border-color: var(--muted);
	}
	.continue-text {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2px;
		min-width: 0;
	}
	.title {
		font-weight: 800;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.meta {
		color: var(--muted);
		font-size: 0.8125rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.progress {
		margin-top: 6px;
		color: var(--accent);
		font-size: 0.8125rem;
		font-weight: 800;
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}
	.section-head a {
		font-size: var(--text-sm);
		font-weight: 700;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
		gap: var(--space-4) var(--space-3);
	}
	.grid a {
		display: flex;
		flex-direction: column;
		gap: 2px;
		color: inherit;
		text-decoration: none;
	}
	.grid a :global(.cover) {
		margin-bottom: 6px;
		transition: transform 0.15s;
	}
	.grid a:hover :global(.cover) {
		transform: translateY(-2px);
	}
	@media (prefers-reduced-motion: reduce) {
		.grid a :global(.cover) {
			transition: none;
		}
	}
	.poster-title {
		font-size: 0.8125rem;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.poster-meta {
		font-size: 0.75rem;
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.empty {
		text-align: center;
		padding: var(--space-6) 0;
		color: var(--muted);
	}
</style>
