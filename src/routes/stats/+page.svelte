<script lang="ts">
	import { MEDIA_TYPES, STATUS_LABELS, MEDIA_STATUSES, type MediaTypeValue } from '#lib/media.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const PLURAL: Record<MediaTypeValue, [string, string]> = {
		movie: ['movie', 'movies'],
		tv: ['TV show', 'TV shows'],
		book: ['book', 'books']
	};
	const plural = (type: MediaTypeValue, n: number) => `${n} ${PLURAL[type][n === 1 ? 0 : 1]}`;
	const LEGEND: Record<MediaTypeValue, string> = { movie: 'Movies', tv: 'TV', book: 'Books' };

	let maxTotal = $derived(Math.max(1, ...data.years.map((y) => y.total)));
	let finishedTotal = $derived(data.years.reduce((sum, y) => sum + y.total, 0));
</script>

<svelte:head>
	<title>Stats · Media Shelf</title>
</svelte:head>

<h1>Stats</h1>

<ul class="tiles" aria-label="Items by status">
	{#each MEDIA_STATUSES as status (status)}
		<li class="tile">
			<span class="tile-value">{data.statusCounts[status] ?? 0}</span>
			<span class="tile-label">{STATUS_LABELS[status]}</span>
		</li>
	{/each}
</ul>

<section aria-labelledby="per-year">
	<h2 id="per-year">Finished per year</h2>

	{#if data.years.length === 0}
		<p class="empty">Nothing finished yet. Mark something Finished and it shows up here.</p>
	{:else}
		<ul class="legend" aria-label="Legend">
			{#each MEDIA_TYPES as type (type)}
				<li><span class="swatch" style:background="var(--series-{type})"></span>{LEGEND[type]}</li>
			{/each}
		</ul>

		<ol class="bars">
			{#each data.years as row (row.year)}
				<li class="bar-row">
					<span class="year">{row.year}</span>
					<span class="track">
						<!-- Room is left at the end of the track for the total -->
						<span class="bar" style:width="calc((100% - 2.5rem) * {row.total / maxTotal})">
							{#each MEDIA_TYPES.filter((type) => row[type] > 0) as type (type)}
								<span
									class="segment"
									style:flex-grow={row[type]}
									style:background="var(--series-{type})"
									role="img"
									aria-label="{row.year}: {plural(type, row[type])}"
								>
									<span class="tip" aria-hidden="true">{plural(type, row[type])}</span>
								</span>
							{/each}
						</span>
						<span class="total">{row.total}</span>
					</span>
				</li>
			{/each}
		</ol>

		<details class="table-view">
			<summary>Show as table</summary>
			<table>
				<thead>
					<tr>
						<th scope="col">Year</th>
						{#each MEDIA_TYPES as type (type)}<th scope="col">{LEGEND[type]}</th>{/each}
						<th scope="col">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each data.years as row (row.year)}
						<tr>
							<th scope="row">{row.year}</th>
							{#each MEDIA_TYPES as type (type)}<td>{row[type]}</td>{/each}
							<td>{row.total}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<th scope="row">All</th>
						{#each MEDIA_TYPES as type (type)}
							<td>{data.years.reduce((sum, y) => sum + y[type], 0)}</td>
						{/each}
						<td>{finishedTotal}</td>
					</tr>
				</tfoot>
			</table>
		</details>
	{/if}
</section>

<section aria-labelledby="ratings">
	<h2 id="ratings">Average rating</h2>
	<ul class="tiles three">
		{#each data.ratings as { type, average, rated } (type)}
			<li class="tile">
				<span class="tile-label">{LEGEND[type]}</span>
				{#if average != null}
					<span class="tile-value">{average.toFixed(1)}<small>/10</small></span>
					<span class="tile-note">from {rated} rated</span>
				{:else}
					<span class="tile-value muted">–</span>
					<span class="tile-note">none rated yet</span>
				{/if}
			</li>
		{/each}
	</ul>
</section>

<p class="about"><a href="/about">About and credits</a></p>

<style>
	h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-4);
	}
	h2 {
		font-size: 1.05rem;
		margin: var(--space-5) 0 var(--space-3);
	}
	.tiles {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-2);
	}
	.tiles.three {
		grid-template-columns: repeat(3, 1fr);
	}
	@media (max-width: 30rem) {
		.tiles {
			grid-template-columns: repeat(2, 1fr);
		}
		.tiles.three {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--space-3);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.tile-value {
		font-size: var(--text-lg);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.tile-value small {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--muted);
	}
	.tile-value.muted {
		color: var(--muted);
	}
	.tile-label,
	.tile-note {
		font-size: var(--text-sm);
		color: var(--muted);
	}
	.tile-label {
		font-weight: 600;
	}

	.legend {
		list-style: none;
		display: flex;
		gap: var(--space-4);
		margin: 0 0 var(--space-3);
		padding: 0;
		font-size: var(--text-sm);
		color: var(--muted);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}
	.swatch {
		width: 10px;
		height: 10px;
		border-radius: 2px;
	}
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}
	.bar-row {
		display: grid;
		grid-template-columns: 3rem 1fr;
		align-items: center;
		column-gap: var(--space-2);
	}
	.year,
	.total {
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}
	.track {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}
	.bar {
		display: flex;
		gap: 2px;
		height: 20px;
		min-width: 6px;
	}
	.segment {
		position: relative;
		flex-basis: 0;
		min-width: 4px;
	}
	/* Rounded only at the data end, square at the baseline */
	.segment:last-child {
		border-radius: 0 4px 4px 0;
	}
	.tip {
		position: absolute;
		bottom: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		padding: 2px var(--space-2);
		border-radius: var(--radius-sm);
		background: var(--text);
		color: var(--bg);
		font-size: 0.75rem;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.1s;
		z-index: 1;
	}
	.segment:hover .tip {
		opacity: 1;
	}
	.table-view {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
	}
	.table-view summary {
		cursor: pointer;
		color: var(--muted);
	}
	table {
		width: 100%;
		margin-top: var(--space-2);
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: var(--space-1) var(--space-2);
		text-align: right;
		border-bottom: 1px solid var(--border);
	}
	th:first-child {
		text-align: left;
	}
	tfoot th,
	tfoot td {
		font-weight: 700;
		border-bottom: 0;
	}
	.empty {
		color: var(--muted);
	}
	.about {
		margin-top: var(--space-6);
		text-align: center;
		font-size: var(--text-sm);
	}
</style>
