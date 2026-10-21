<script lang="ts">
	import { tick } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import Cover, { coverTint } from '#lib/components/Cover.svelte';
	import DetailsFields from '#lib/components/DetailsFields.svelte';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import StarRating from '#lib/components/StarRating.svelte';
	import {
		MEDIA_STATUSES,
		STATUS_LABELS,
		TYPE_LABELS,
		formatLength,
		type MediaStatusValue
	} from '#lib/media.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let item = $derived(data.item);

	// Local edits; reset whenever the server sends a fresh item
	let status = $derived<MediaStatusValue>(item.status);
	let detailsOpen = $state(false);
	$effect.pre(() => {
		if (form?.detailsErrors) detailsOpen = true;
	});
	let busy = $state(false);

	let [tint] = $derived(coverTint(item.title));

	const dateFormat = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const formatDate = (date: Date | null) => (date ? dateFormat.format(date) : null);

	// The one obvious next step for each status, next to the status picker
	const NEXT: Partial<Record<MediaStatusValue, { label: string; to: MediaStatusValue; icon: IconName }>> =
		{
			want: { label: 'Start it', to: 'in_progress', icon: 'play' },
			in_progress: { label: 'Mark finished', to: 'finished', icon: 'check' },
			dropped: { label: 'Start again', to: 'in_progress', icon: 'play' }
		};
	let next = $derived(NEXT[status]);

	// Season picker: up to the known total, or a few past the current one when it's unknown
	let seasonCount = $derived(
		item.seasonsTotal ?? Math.max(item.currentSeason ?? 1, 1) + 3
	);

	// Progress saves itself: right away for pickers, after a pause while typing
	let progressForm = $state<HTMLFormElement>();
	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let typingTimer: ReturnType<typeof setTimeout> | undefined;
	let textOnly = false;

	function saveNow() {
		clearTimeout(typingTimer);
		textOnly = false;
		progressForm?.requestSubmit();
	}

	function saveAfterTyping() {
		clearTimeout(typingTimer);
		typingTimer = setTimeout(() => {
			textOnly = true;
			progressForm?.requestSubmit();
		}, 800);
	}

	function onProgressChange(event: Event) {
		const target = event.target as HTMLElement;
		// Text fields save from their input events; change fires again on blur
		if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
			if (target.type !== 'radio') return;
		}
		saveNow();
	}

	let rating = $derived<number | null>(item.rating);
	async function clearRating() {
		rating = null;
		// With no star selected the form sends no rating, which saves it as empty
		await tick();
		saveNow();
	}

	async function moveTo(next: MediaStatusValue) {
		status = next;
		// Let the season and rating fields for the new status render before saving
		await tick();
		saveNow();
	}

	const saveProgress: SubmitFunction = () => {
		saveState = 'saving';
		// Typing saves keep the page as is, so a refresh can't overwrite what's being typed
		const keepPage = textOnly;
		return async ({ result, update }) => {
			await update({ reset: false, invalidateAll: !keepPage });
			saveState = result.type === 'success' ? 'saved' : 'error';
		};
	};

	const saveDetails: SubmitFunction = () => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false });
			busy = false;
		};
	};

	// Long descriptions show four lines; "More" appears only when there's more to show
	let aboutOpen = $state(false);
	let aboutLong = $state(false);
	function measureAbout(element: HTMLElement) {
		const measure = () => {
			if (!aboutOpen) aboutLong = element.scrollHeight > element.clientHeight + 1;
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}

	let menu = $state<HTMLDetailsElement>();
	let detailsSection = $state<HTMLElement>();
	function editDetails() {
		if (menu) menu.open = false;
		detailsOpen = true;
		requestAnimationFrame(() => detailsSection?.scrollIntoView({ behavior: 'smooth' }));
	}
</script>

<svelte:head>
	<title>{item.title} · Media Shelf</title>
</svelte:head>

<div class="band" style:--tint={tint}>
	{#if item.coverUrl}
		<img class="band-art" src={item.coverUrl} alt="" />
	{/if}
	<a class="icon-button on-art" href="/" aria-label="Back to shelf">
		<Icon name="back" size={22} stroke={2.25} />
	</a>
	<details class="menu" bind:this={menu}>
		<summary class="icon-button on-art" aria-label="More: edit details, delete">
			<Icon name="more" stroke={2.5} />
		</summary>
		<div class="menu-panel">
			<button type="button" onclick={editDetails}>Edit details</button>
			<form
				method="POST"
				action="?/delete"
				onsubmit={(event) => {
					if (!confirm(`Delete "${item.title}"? This can't be undone.`)) event.preventDefault();
				}}
			>
				<button class="danger">Delete</button>
			</form>
		</div>
	</details>
</div>

<section class="hero">
	<div class="hero-cover">
		<Cover url={item.coverUrl} type={item.type} title={item.title} width={132} />
	</div>
	<h1>{item.title}</h1>
	<p class="meta">
		{[
			TYPE_LABELS[item.type],
			item.year,
			item.creator,
			formatLength(item.type, item.length),
			item.type === 'tv' && item.seasonsTotal && `${item.seasonsTotal} seasons`
		]
			.filter(Boolean)
			.join(' · ')}
	</p>
</section>

<form
	method="POST"
	action="?/progress"
	class="progress"
	bind:this={progressForm}
	use:enhance={saveProgress}
	onchange={onProgressChange}
>
	<div class="status-row" class:single={!next}>
		<div class="status-picker">
			<label for="status" class="visually-hidden">Status</label>
			<span class="dot" aria-hidden="true"></span>
			<select id="status" name="status" bind:value={status}>
				{#each MEDIA_STATUSES as option (option)}
					<option value={option}>{STATUS_LABELS[option]}</option>
				{/each}
			</select>
		</div>
		{#if next}
			<button type="button" class="button primary" onclick={() => moveTo(next.to)}>
				<Icon name={next.icon} size={18} stroke={2.5} />{next.label}
			</button>
		{/if}
	</div>

	{#if item.type === 'tv' && status === 'in_progress'}
		<div class="card row">
			<label for="current_season">Watching</label>
			<select
				id="current_season"
				name="current_season"
				class="season"
				aria-invalid={form?.progressErrors?.current_season ? 'true' : undefined}
			>
				{#each Array.from({ length: seasonCount }, (_, i) => i + 1) as season (season)}
					<option value={season} selected={season === (item.currentSeason ?? 1)}>
						Season {season}
					</option>
				{/each}
			</select>
		</div>
		{#if form?.progressErrors?.current_season}
			<p class="field-error">{form.progressErrors.current_season}</p>
		{/if}
	{/if}

	{#if status === 'finished'}
		<fieldset class="card rating">
			<legend>Your rating</legend>
			<div class="rating-control">
				<StarRating name="rating" bind:value={rating} onclear={clearRating} />
			</div>
			{#if form?.progressErrors?.rating}
				<p class="field-error">{form.progressErrors.rating}</p>
			{/if}
		</fieldset>
	{/if}

	{#if data.overview}
		<section class="about">
			<h2>About</h2>
			<p id="about-text" class:clamped={!aboutOpen} {@attach measureAbout}>{data.overview}</p>
			{#if aboutLong}
				<button
					type="button"
					class="more"
					aria-expanded={aboutOpen}
					aria-controls="about-text"
					onclick={() => (aboutOpen = !aboutOpen)}
				>
					{aboutOpen ? 'Less' : 'More'}
				</button>
			{/if}
		</section>
	{/if}

	<div class="card notes">
		<div class="notes-head">
			<h2>Your notes</h2>
			<span class="save-state" class:error={saveState === 'error'} role="status">
				{#if saveState === 'saving'}
					Saving…
				{:else if saveState === 'saved'}
					<Icon name="check" size={14} stroke={2.75} />Saved
				{:else if saveState === 'error'}
					Couldn't save
				{/if}
			</span>
		</div>
		<div>
			<label for="notes">{status === 'finished' ? 'How was it?' : 'Notes'}</label>
			<textarea
				id="notes"
				name="notes"
				placeholder="Anything to remember about it"
				value={item.notes ?? ''}
				oninput={saveAfterTyping}
			></textarea>
		</div>
		<div>
			<label for="heard_from">Heard from</label>
			<input
				id="heard_from"
				name="heard_from"
				placeholder="A friend, an article, a podcast…"
				value={item.heardFrom ?? ''}
				oninput={saveAfterTyping}
			/>
		</div>
		<noscript><button class="button primary">Save</button></noscript>
	</div>
</form>

<p class="dates">
	Added {formatDate(item.addedAt)}
	{#if item.startedAt}· started {formatDate(item.startedAt)}{/if}
	{#if item.finishedAt}· finished {formatDate(item.finishedAt)}{/if}
</p>

<details class="card edit" bind:open={detailsOpen} bind:this={detailsSection}>
	<summary>Edit details</summary>
	<form method="POST" action="?/details" use:enhance={saveDetails}>
		<DetailsFields type={item.type} chooseType={false} values={item} errors={form?.detailsErrors} />
		<div class="actions">
			<button class="button primary" disabled={busy}>Save details</button>
			{#if form?.saved === 'details'}<span class="saved" role="status">Saved</span>{/if}
		</div>
	</form>
</details>

<style>
	/* Full-bleed band in the cover's colour (or the cover itself, blurred) behind the header */
	.band {
		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		height: 13rem;
		margin: calc(-1 * var(--space-4)) calc(-1 * var(--gutter)) 0;
		padding: var(--space-3) var(--space-4);
		background: var(--tint);
		/* Clips the blurred art's soft edges */
		overflow: hidden;
	}
	.band-art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(28px) brightness(0.55) saturate(1.2);
		transform: scale(1.2);
		pointer-events: none;
	}
	.on-art {
		position: relative;
		z-index: 1;
		background: rgb(0 0 0 / 0.35);
		color: #ffffff;
	}
	.menu {
		position: relative;
		z-index: 2;
	}
	.menu summary {
		list-style: none;
	}
	.menu summary::-webkit-details-marker {
		display: none;
	}
	/* The band clips overflow, so the open menu is placed fixed under the button */
	.menu-panel {
		position: fixed;
		top: 4rem;
		right: max(var(--space-4), calc((100vw - var(--max-width)) / 2));
		z-index: 20;
		display: grid;
		min-width: 12rem;
		padding: var(--space-1);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.45);
	}
	.menu-panel button {
		width: 100%;
		min-height: 2.75rem;
		padding: 0 var(--space-3);
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--text);
		font-weight: 700;
		text-align: left;
		cursor: pointer;
	}
	.menu-panel button:hover {
		background: var(--surface);
	}
	.menu-panel .danger {
		color: var(--danger);
	}

	.hero {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		margin-top: -7.125rem;
		text-align: center;
	}
	.hero-cover {
		border-radius: 12px;
		box-shadow:
			0 0 0 4px var(--bg),
			0 12px 28px rgb(0 0 0 / 0.5);
	}
	h1 {
		margin-top: 0.875rem;
		font-size: var(--text-xl);
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.meta {
		margin: 0;
		color: var(--muted);
		font-size: 0.9375rem;
	}

	.progress {
		display: grid;
		gap: var(--space-4);
		margin-top: var(--space-5);
	}
	.status-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.625rem;
	}
	.status-row.single {
		grid-template-columns: 1fr;
	}
	.status-row .button {
		border-radius: var(--radius-md);
	}
	/* Native select dressed as a button, with an amber dot for the current status */
	.status-picker {
		position: relative;
	}
	.status-picker .dot {
		position: absolute;
		left: 1rem;
		top: 50%;
		width: 8px;
		height: 8px;
		margin-top: -4px;
		border-radius: 999px;
		background: var(--accent);
		pointer-events: none;
	}
	.status-picker select {
		height: 3rem;
		padding-left: 2rem;
		border-color: var(--border);
		border-radius: var(--radius-md);
		font-weight: 700;
	}

	.card {
		margin: 0;
		padding: var(--space-4);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
	}
	.row label {
		margin: 0;
		color: var(--text);
		font-size: 1rem;
	}
	.season {
		width: auto;
		min-width: 9.25rem;
		min-height: 2.75rem;
		background-color: var(--surface-2);
		font-weight: 700;
	}

	/* The legend is floated to sit inside the card's padding; the control starts below it */
	.rating-control {
		clear: both;
	}
	.rating legend {
		float: left;
		width: 100%;
		margin-bottom: var(--space-3);
		padding: 0;
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--muted);
	}
	h2 {
		font-size: 1.0625rem;
		font-weight: 800;
	}
	.about {
		display: grid;
		gap: 0.375rem;
		margin-top: var(--space-2);
	}
	.about p {
		margin: 0;
		color: var(--text-soft);
		font-size: 0.9375rem;
		line-height: 1.55;
		/* Keeps the source's paragraph breaks */
		white-space: pre-line;
	}
	.about p.clamped {
		display: -webkit-box;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.more {
		justify-self: start;
		padding: var(--space-1) 0;
		border: 0;
		background: none;
		color: var(--accent);
		font-size: 0.9375rem;
		font-weight: 700;
		cursor: pointer;
	}

	.notes {
		display: grid;
		gap: 0.875rem;
	}
	.notes-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.save-state {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--muted);
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.save-state.error {
		color: var(--danger);
	}
	.notes textarea,
	.notes input {
		background: var(--bg);
	}

	.dates {
		margin: var(--space-4) 0;
		color: var(--muted);
		font-size: var(--text-sm);
		text-align: center;
	}

	.edit summary {
		font-weight: 700;
		cursor: pointer;
	}
	.edit form {
		display: grid;
		gap: var(--space-4);
		margin-top: var(--space-4);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.saved {
		color: var(--accent);
		font-size: var(--text-sm);
		font-weight: 700;
	}
</style>
