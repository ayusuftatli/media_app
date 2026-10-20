<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import DetailsFields from '#lib/components/DetailsFields.svelte';
	import { isMediaType, type MediaTypeValue } from '#lib/media.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	// Prefilled from "Can't find it?" on the search screen
	const prefillType = page.url.searchParams.get('type');
	const prefill = { title: page.url.searchParams.get('title') ?? '' };

	let type = $derived<MediaTypeValue>(
		form?.values.type ?? (isMediaType(prefillType) ? prefillType : 'movie')
	);
	let saving = $state(false);
</script>

<svelte:head>
	<title>Add by hand · Media Shelf</title>
</svelte:head>

<a class="back" href="/add">← Search</a>
<h1>Add by hand</h1>

<form
	method="POST"
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	<DetailsFields bind:type values={form?.values ?? prefill} errors={form?.errors} />

	<div>
		<label for="heard_from">Heard from <span class="optional">(optional)</span></label>
		<input
			id="heard_from"
			name="heard_from"
			placeholder="A friend, an article, a podcast…"
			value={form?.values.heardFrom ?? ''}
		/>
	</div>

	<button class="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save to Want to'}</button>
</form>

<style>
	.back {
		display: inline-block;
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
		text-decoration: none;
	}
	h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-4);
	}
	form {
		display: grid;
		gap: var(--space-4);
	}
	.optional {
		font-weight: 400;
		color: var(--muted);
	}
</style>
