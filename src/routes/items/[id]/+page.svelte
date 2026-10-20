<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import Cover from '#lib/components/Cover.svelte';
	import DetailsFields from '#lib/components/DetailsFields.svelte';
	import {
		MEDIA_STATUSES,
		STATUS_LABELS,
		TYPE_LABELS,
		creatorLabel,
		formatLength,
		type MediaStatusValue,
		type MediaTypeValue
	} from '#lib/media.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let item = $derived(data.item);

	// Local edits; reset whenever the server sends a fresh item
	let status = $derived<MediaStatusValue>(item.status);
	let detailsType = $derived<MediaTypeValue>(item.type);
	let busy = $state(false);

	const dateFormat = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const formatDate = (date: Date | null) => (date ? dateFormat.format(date) : null);

	const submit: SubmitFunction = () => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false });
			busy = false;
		};
	};
</script>

<svelte:head>
	<title>{item.title} · Media Shelf</title>
</svelte:head>

<a class="back" href="/">← List</a>

<section class="summary">
	<Cover url={item.coverUrl} type={item.type} width={96} />
	<div>
		<h1>{item.title}</h1>
		<p class="meta">
			{[
				TYPE_LABELS[item.type],
				item.year,
				item.creator && `${creatorLabel(item.type)}: ${item.creator}`,
				formatLength(item.type, item.length),
				item.type === 'tv' && item.seasonsTotal && `${item.seasonsTotal} seasons`
			]
				.filter(Boolean)
				.join(' · ')}
		</p>
		<p class="dates">
			Added {formatDate(item.addedAt)}
			{#if item.startedAt}· started {formatDate(item.startedAt)}{/if}
			{#if item.finishedAt}· finished {formatDate(item.finishedAt)}{/if}
		</p>
	</div>
</section>

<form method="POST" action="?/progress" class="card" use:enhance={submit}>
	<fieldset class="statuses">
		<legend>Status</legend>
		<div class="options">
			{#each MEDIA_STATUSES as option (option)}
				<label>
					<input type="radio" name="status" value={option} bind:group={status} />
					<span>{STATUS_LABELS[option]}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	{#if item.type === 'tv' && status === 'in_progress'}
		<div>
			<label for="current_season">Current season</label>
			<div class="season">
				<input
					id="current_season"
					name="current_season"
					inputmode="numeric"
					value={item.currentSeason ?? 1}
					aria-invalid={form?.progressErrors?.current_season ? 'true' : undefined}
				/>
				{#if item.seasonsTotal}<span>of {item.seasonsTotal}</span>{/if}
			</div>
			{#if form?.progressErrors?.current_season}
				<p class="field-error">{form.progressErrors.current_season}</p>
			{/if}
		</div>
	{/if}

	{#if status === 'finished'}
		<fieldset class="rating">
			<legend>Rating</legend>
			<div class="options">
				{#each Array.from({ length: 10 }, (_, i) => i + 1) as value (value)}
					<label>
						<input
							type="radio"
							name="rating"
							{value}
							checked={item.rating === value}
						/>
						<span>{value}</span>
					</label>
				{/each}
			</div>
			{#if form?.progressErrors?.rating}
				<p class="field-error">{form.progressErrors.rating}</p>
			{/if}
		</fieldset>
	{/if}

	<div>
		<label for="notes">{status === 'finished' ? 'How was it?' : 'Notes'}</label>
		<textarea id="notes" name="notes" value={item.notes ?? ''}></textarea>
	</div>

	<div>
		<label for="heard_from">Heard from</label>
		<input id="heard_from" name="heard_from" value={item.heardFrom ?? ''} />
	</div>

	<div class="actions">
		<button class="button primary" disabled={busy}>Save</button>
		{#if form?.saved === 'progress'}<span class="saved" role="status">Saved</span>{/if}
	</div>
</form>

<details class="card" open={!!form?.detailsErrors}>
	<summary>Edit details</summary>
	<form method="POST" action="?/details" use:enhance={submit}>
		<DetailsFields bind:type={detailsType} values={item} errors={form?.detailsErrors} />
		<div class="actions">
			<button class="button" disabled={busy}>Save details</button>
			{#if form?.saved === 'details'}<span class="saved" role="status">Saved</span>{/if}
		</div>
	</form>
</details>

<form
	method="POST"
	action="?/delete"
	class="delete"
	onsubmit={(event) => {
		if (!confirm(`Delete "${item.title}"? This can't be undone.`)) event.preventDefault();
	}}
>
	<button class="button danger">Delete</button>
</form>

<style>
	.back {
		display: inline-block;
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
		text-decoration: none;
	}
	.summary {
		display: flex;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}
	h1 {
		font-size: var(--text-lg);
	}
	.meta,
	.dates {
		margin: var(--space-1) 0 0;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.card {
		display: grid;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
		padding: var(--space-4);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	details.card {
		display: block;
	}
	details form {
		display: grid;
		gap: var(--space-4);
		margin-top: var(--space-4);
	}
	summary {
		font-weight: 600;
		cursor: pointer;
	}
	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		margin-bottom: var(--space-1);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.options label {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
	}
	.options input {
		position: absolute;
		opacity: 0;
	}
	.options span {
		display: block;
		min-width: 2.75rem;
		padding: var(--space-2) var(--space-3);
		text-align: center;
		border: 1px solid var(--border);
		border-radius: 999px;
		cursor: pointer;
	}
	.options input:checked + span {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-text);
	}
	.options input:focus-visible + span {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.season {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.season input {
		width: 5rem;
	}
	.season span {
		color: var(--muted);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.saved {
		color: var(--accent);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.delete {
		margin-top: var(--space-6);
	}
</style>
