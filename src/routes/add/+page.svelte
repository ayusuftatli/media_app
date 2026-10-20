<script lang="ts">
	import { tick } from 'svelte';
	import { enhance, type SubmitFunction } from '$app/forms';
	import Cover from '#lib/components/Cover.svelte';
	import { MEDIA_TYPES, TYPE_LABELS, type MediaTypeValue } from '#lib/media.ts';
	import type { SearchResult } from '#lib/search.ts';

	let type = $state<MediaTypeValue>('movie');
	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let searchState = $state<'idle' | 'loading' | 'done' | 'error'>('idle');
	let searchError = $state('');

	let dialog = $state<HTMLDialogElement>();
	let saveButton = $state<HTMLButtonElement>();
	let selected = $state<SearchResult | null>(null);
	let saving = $state(false);
	let saveError = $state('');
	let toast = $state<{ title: string; id: string; duplicate: boolean } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	// Search as you type: wait for a pause, and cancel the previous request when the input changes
	$effect(() => {
		const q = query.trim();
		const t = type;
		if (q.length < 2) {
			results = [];
			searchState = 'idle';
			return;
		}

		searchState = 'loading';
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/search?type=${t}&q=${encodeURIComponent(q)}`, {
					signal: controller.signal
				});
				if (!response.ok) {
					const body = await response.json().catch(() => null);
					throw new Error(body?.message ?? `Search failed (${response.status})`);
				}
				results = await response.json();
				searchState = 'done';
			} catch (err) {
				if (controller.signal.aborted) return;
				searchError = err instanceof Error ? err.message : 'Search failed';
				searchState = 'error';
			}
		}, 300);

		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	async function choose(result: SearchResult) {
		selected = result;
		saveError = '';
		// Render the sheet's content first, then open it with Save focused (not the text field,
		// so the phone keyboard stays down for the one-tap path)
		await tick();
		dialog?.showModal();
		saveButton?.focus();
	}

	function markSaved(sourceId: string, id: string) {
		results = results.map((r) => (r.sourceId === sourceId ? { ...r, savedId: id } : r));
	}

	function showToast(title: string, id: string, duplicate: boolean) {
		clearTimeout(toastTimer);
		toast = { title, id, duplicate };
		toastTimer = setTimeout(() => (toast = null), 5000);
	}

	const save: SubmitFunction = () => {
		saving = true;
		saveError = '';
		const current = selected;
		return async ({ result }) => {
			saving = false;
			if (!current) return;

			if (result.type === 'success' && typeof result.data?.savedId === 'string') {
				markSaved(current.sourceId, result.data.savedId);
				showToast(current.title, result.data.savedId, false);
				dialog?.close();
			} else if (result.type === 'failure' && typeof result.data?.duplicateId === 'string') {
				markSaved(current.sourceId, result.data.duplicateId);
				showToast(current.title, result.data.duplicateId, true);
				dialog?.close();
			} else if (result.type === 'failure') {
				saveError = String(result.data?.message ?? 'Could not save. Try again.');
			} else {
				saveError = 'Could not save. Try again.';
			}
		};
	};
</script>

<svelte:head>
	<title>Add · Media Shelf</title>
</svelte:head>

<h1>Add</h1>

<div class="search">
	<fieldset class="segmented">
		<legend class="visually-hidden">Type</legend>
		{#each MEDIA_TYPES as option (option)}
			<label>
				<input type="radio" name="type" value={option} bind:group={type} />
				<span>{TYPE_LABELS[option]}</span>
			</label>
		{/each}
	</fieldset>

	<label for="q" class="visually-hidden">Search</label>
	<!-- svelte-ignore a11y_autofocus -->
	<input
		id="q"
		type="search"
		bind:value={query}
		placeholder={type === 'book' ? 'Title or author' : 'Title'}
		autocomplete="off"
		enterkeyhint="search"
		autofocus
	/>
</div>

<div aria-live="polite">
	{#if searchState === 'loading' && results.length === 0}
		<p class="hint">Searching…</p>
	{:else if searchState === 'error'}
		<p class="hint error">{searchError}</p>
	{:else if searchState === 'done' && results.length === 0}
		<p class="hint">No matches.</p>
	{:else if searchState === 'idle'}
		<p class="hint">
			Search {type === 'book' ? 'Open Library' : 'TMDB'} for a {TYPE_LABELS[type].toLowerCase()}.
		</p>
	{/if}
</div>

{#if results.length > 0}
	<ul class="results" class:stale={searchState === 'loading'}>
		{#each results as result (result.sourceId)}
			{@const meta = [result.year, result.creator].filter(Boolean).join(' · ')}
			<li>
				{#if result.savedId}
					<a class="result" href="/items/{result.savedId}">
						<Cover url={result.coverUrl} type={result.type} width={48} />
						<span class="text">
							<span class="title">{result.title}</span>
							{#if meta}<span class="meta">{meta}</span>{/if}
							<span class="saved-tag">On your shelf</span>
						</span>
					</a>
				{:else}
					<button class="result" type="button" onclick={() => choose(result)}>
						<Cover url={result.coverUrl} type={result.type} width={48} />
						<span class="text">
							<span class="title">{result.title}</span>
							{#if meta}<span class="meta">{meta}</span>{/if}
							{#if result.blurb}<span class="blurb">{result.blurb}</span>{/if}
						</span>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

{#if searchState !== 'idle'}
	<p class="manual">
		Can't find it?
		<a href="/add/manual?type={type}&title={encodeURIComponent(query.trim())}">Add it by hand</a>
	</p>
{:else}
	<p class="manual"><a href="/add/manual?type={type}">Add by hand</a></p>
{/if}

<dialog bind:this={dialog} onclose={() => (selected = null)} aria-labelledby="sheet-title">
	{#if selected}
		<form method="POST" action="?/save" use:enhance={save}>
			<input type="hidden" name="source" value={selected.source} />
			<input type="hidden" name="source_id" value={selected.sourceId} />

			<div class="sheet-summary">
				<Cover url={selected.coverUrl} type={selected.type} width={56} />
				<div>
					<h2 id="sheet-title">{selected.title}</h2>
					<p class="meta">
						{[TYPE_LABELS[selected.type], selected.year, selected.creator].filter(Boolean).join(' · ')}
					</p>
				</div>
			</div>

			<div>
				<label for="heard_from">Heard from <span class="optional">(optional)</span></label>
				<input
					id="heard_from"
					name="heard_from"
					placeholder="A friend, an article, a podcast…"
					autocomplete="off"
				/>
			</div>

			{#if saveError}<p class="field-error" role="alert">{saveError}</p>{/if}

			<div class="sheet-actions">
				<button class="button" type="button" onclick={() => dialog?.close()}>Cancel</button>
				<button class="button primary" disabled={saving} bind:this={saveButton}>
					{saving ? 'Saving…' : 'Save to Want to'}
				</button>
			</div>
		</form>
	{/if}
</dialog>

{#if toast}
	<div class="toast" role="status">
		<span>{toast.duplicate ? 'Already on your shelf:' : 'Saved:'} {toast.title}</span>
		<a href="/items/{toast.id}">View</a>
	</div>
{/if}

<style>
	h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-4);
	}
	.search {
		display: grid;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}
	.hint {
		color: var(--muted);
		font-size: var(--text-sm);
		margin: var(--space-2) 0;
	}
	.hint.error {
		color: var(--danger);
	}
	.results {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
		transition: opacity 0.15s;
	}
	.results.stale {
		opacity: 0.6;
	}
	.result {
		display: flex;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: inherit;
		text-align: left;
		text-decoration: none;
		font: inherit;
		cursor: pointer;
	}
	.result:hover {
		border-color: var(--muted);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.title {
		font-weight: 600;
	}
	.meta,
	.blurb {
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.blurb {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.saved-tag {
		align-self: flex-start;
		margin-top: var(--space-1);
		padding: 1px var(--space-2);
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
	}
	.manual {
		margin: var(--space-5) 0 0;
		text-align: center;
		font-size: var(--text-sm);
		color: var(--muted);
	}

	/* Bottom sheet on phones, centered card on wider screens */
	dialog {
		width: 100%;
		max-width: var(--max-width);
		margin: auto auto 0;
		padding: var(--space-4) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
		border: 1px solid var(--border);
		border-radius: var(--radius) var(--radius) 0 0;
		background: var(--surface);
		color: var(--text);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
	}
	@media (min-width: 40rem) {
		dialog {
			margin: auto;
			max-width: 28rem;
			border-radius: var(--radius);
		}
	}
	dialog form {
		display: grid;
		gap: var(--space-4);
	}
	.sheet-summary {
		display: flex;
		gap: var(--space-3);
	}
	h2 {
		font-size: 1.1rem;
	}
	.optional {
		font-weight: 400;
		color: var(--muted);
	}
	.sheet-actions {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: var(--space-2);
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		display: flex;
		gap: var(--space-3);
		align-items: center;
		width: max-content;
		max-width: calc(100% - 2 * var(--space-4));
		padding: var(--space-2) var(--space-4);
		border-radius: 999px;
		background: var(--text);
		color: var(--bg);
		font-size: var(--text-sm);
	}
	.toast span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.toast a {
		color: inherit;
		font-weight: 700;
	}
</style>
