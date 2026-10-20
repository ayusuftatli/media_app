<script lang="ts">
	import { MEDIA_TYPES, TYPE_LABELS, creatorLabel, lengthLabel, type MediaTypeValue } from '#lib/media.ts';

	type Values = {
		title?: string | null;
		creator?: string | null;
		year?: number | string | null;
		length?: number | string | null;
		seasonsTotal?: number | string | null;
		coverUrl?: string | null;
	};

	let {
		type = $bindable(),
		values = {},
		errors = {}
	}: {
		type: MediaTypeValue;
		values?: Values;
		errors?: Partial<Record<string, string>>;
	} = $props();
</script>

{#snippet error(name: string)}
	{#if errors[name]}
		<p id="{name}-error" class="field-error">{errors[name]}</p>
	{/if}
{/snippet}

<fieldset class="types">
	<legend class="visually-hidden">Type</legend>
	{#each MEDIA_TYPES as option (option)}
		<label>
			<input type="radio" name="type" value={option} bind:group={type} />
			<span>{TYPE_LABELS[option]}</span>
		</label>
	{/each}
</fieldset>
{@render error('type')}

<div>
	<label for="title">Title</label>
	<input
		id="title"
		name="title"
		value={values.title ?? ''}
		required
		aria-invalid={errors.title ? 'true' : undefined}
		aria-describedby={errors.title ? 'title-error' : undefined}
	/>
	{@render error('title')}
</div>

<div class="row">
	<div class="grow">
		<label for="creator">{creatorLabel(type)}</label>
		<input id="creator" name="creator" value={values.creator ?? ''} />
	</div>
	<div class="narrow">
		<label for="year">Year</label>
		<input
			id="year"
			name="year"
			inputmode="numeric"
			value={values.year ?? ''}
			aria-invalid={errors.year ? 'true' : undefined}
			aria-describedby={errors.year ? 'year-error' : undefined}
		/>
	</div>
</div>
{@render error('year')}

{#if type === 'tv'}
	<div>
		<label for="seasons_total">Seasons</label>
		<input
			id="seasons_total"
			name="seasons_total"
			inputmode="numeric"
			value={values.seasonsTotal ?? ''}
			aria-invalid={errors.seasons_total ? 'true' : undefined}
			aria-describedby={errors.seasons_total ? 'seasons_total-error' : undefined}
		/>
		{@render error('seasons_total')}
	</div>
{:else}
	<div>
		<label for="length">{lengthLabel(type)}</label>
		<input
			id="length"
			name="length"
			inputmode="numeric"
			value={values.length ?? ''}
			aria-invalid={errors.length ? 'true' : undefined}
			aria-describedby={errors.length ? 'length-error' : undefined}
		/>
		{@render error('length')}
	</div>
{/if}

<div>
	<label for="cover_url">Cover image URL</label>
	<input
		id="cover_url"
		name="cover_url"
		type="url"
		inputmode="url"
		placeholder="https://…"
		value={values.coverUrl ?? ''}
		aria-invalid={errors.cover_url ? 'true' : undefined}
		aria-describedby={errors.cover_url ? 'cover_url-error' : undefined}
	/>
	{@render error('cover_url')}
</div>

<style>
	.types {
		display: flex;
		gap: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	.types label {
		flex: 1;
		margin: 0;
		font-size: 1rem;
	}
	.types input {
		position: absolute;
		opacity: 0;
	}
	.types span {
		display: block;
		padding: var(--space-2);
		text-align: center;
		border: 1px solid var(--border);
		background: var(--surface);
		cursor: pointer;
	}
	.types label:first-of-type span {
		border-radius: var(--radius-sm) 0 0 var(--radius-sm);
	}
	.types label:last-of-type span {
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}
	.types label + label span {
		border-left: 0;
	}
	.types input:checked + span {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-text);
	}
	.types input:focus-visible + span {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.row {
		display: flex;
		gap: var(--space-3);
	}
	.grow {
		flex: 1;
		min-width: 0;
	}
	.narrow {
		width: 6rem;
	}
</style>
