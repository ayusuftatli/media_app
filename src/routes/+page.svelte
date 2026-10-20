<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Cover from '#lib/components/Cover.svelte';
	import {
		LENGTH_FILTERS,
		STATUS_FILTERS,
		filtersQuery,
		hasActiveFilters,
		lengthOptionsFor,
		parseFilters
	} from '#lib/filters.ts';
	import { MEDIA_TYPES, STATUS_LABELS, TYPE_LABELS, formatLength } from '#lib/media.ts';
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

	// Pick always draws from "Want to", so the status filter isn't passed along
	let pickHref = $derived(`/pick${filtersQuery({ ...filters, status: 'active' })}`);
</script>

<svelte:head>
	<title>Media Shelf</title>
</svelte:head>

<form class="filters" method="GET" bind:this={form} onsubmit={apply}>
	<div class="search-row">
		<label for="q" class="visually-hidden">Search my list</label>
		<input
			id="q"
			name="q"
			type="search"
			placeholder="Search my list"
			value={filters.q}
			autocomplete="off"
			enterkeyhint="search"
			oninput={applySoon}
		/>
		<a class="button primary surprise" href={pickHref}>Surprise me</a>
	</div>

	<fieldset class="segmented">
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
				<span>{TYPE_LABELS[option]}</span>
			</label>
		{/each}
	</fieldset>

	<div class="selects">
		<div>
			<label for="status" class="visually-hidden">Status</label>
			<select id="status" name="status" value={filters.status} onchange={() => apply()}>
				{#each Object.entries(STATUS_FILTERS) as [value, label] (value)}
					<option {value}>{label}</option>
				{/each}
			</select>
		</div>
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

	<noscript><button class="button">Apply</button></noscript>
</form>

<p class="count" aria-live="polite">
	{data.items.length}
	{data.items.length === 1 ? 'item' : 'items'}
	{#if filtered}· <a href="/">Clear filters</a>{/if}
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
	<ul>
		{#each data.items as item (item.id)}
			{@const length = formatLength(item.type, item.length)}
			<li>
				<a href="/items/{item.id}">
					<Cover url={item.coverUrl} type={item.type} />
					<div class="info">
						<span class="title">{item.title}</span>
						<span class="meta">
							{[TYPE_LABELS[item.type], item.year, item.creator, length]
								.filter(Boolean)
								.join(' · ')}
						</span>
						<span class="badges">
							{#if item.status !== 'want'}
								<span class="badge {item.status}">{STATUS_LABELS[item.status]}</span>
							{/if}
							{#if item.type === 'tv' && item.status === 'in_progress' && item.currentSeason}
								<span class="badge">Season {item.currentSeason}</span>
							{/if}
							{#if item.rating}
								<span class="badge">{item.rating}/10</span>
							{/if}
						</span>
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.filters {
		display: grid;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}
	.search-row {
		display: flex;
		gap: var(--space-2);
	}
	.search-row input {
		flex: 1;
		min-width: 0;
	}
	.surprise {
		flex: none;
	}
	.selects {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--space-2);
	}
	.count {
		margin: 0 0 var(--space-3);
		color: var(--muted);
		font-size: var(--text-sm);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}
	li a {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-2);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: inherit;
		text-decoration: none;
	}
	li a:hover {
		border-color: var(--muted);
	}
	.info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		padding-top: 2px;
	}
	.title {
		font-weight: 600;
	}
	.meta {
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-top: var(--space-1);
	}
	.badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 1px var(--space-2);
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--muted);
	}
	.badge.in_progress {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.empty {
		text-align: center;
		padding: var(--space-6) 0;
		color: var(--muted);
	}
</style>
