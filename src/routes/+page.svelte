<script lang="ts">
	import Cover from '#lib/components/Cover.svelte';
	import { STATUS_LABELS, TYPE_LABELS, formatLength } from '#lib/media.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Media Shelf</title>
</svelte:head>

<div class="heading">
	<h1>{data.showAll ? 'Everything' : 'Up next'}</h1>
	<a href={data.showAll ? '/' : '/?show=all'}>
		{data.showAll ? 'Show up next only' : 'Show finished and dropped too'}
	</a>
</div>

{#if data.items.length === 0}
	<div class="empty">
		<p>{data.showAll ? 'Nothing saved yet.' : 'Nothing waiting. Nice.'}</p>
		<a class="button primary" href="/add">Add something</a>
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
	.heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}
	.heading a {
		font-size: var(--text-sm);
	}
	h1 {
		font-size: var(--text-xl);
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
