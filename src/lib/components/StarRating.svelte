<script lang="ts">
	// Five whole stars, one radio each, so arrow keys move a star at a time
	let {
		name,
		value = $bindable(null),
		onclear
	}: { name: string; value?: number | null; onclear?: () => void } = $props();

	let hover = $state<number | null>(null);
	let shown = $derived(hover ?? value ?? 0);

	const STAR =
		'M12 2.6l2.85 6.03 6.6.78-4.88 4.53 1.3 6.53L12 17.2l-5.87 3.27 1.3-6.53L2.55 9.41l6.6-.78z';
</script>

<div class="rating">
	<!-- Only clears the mouse hover preview; the radios inside carry all the interaction -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="stars" onpointerleave={() => (hover = null)}>
		{#each [1, 2, 3, 4, 5] as star (star)}
			<label class="star" class:on={star <= shown} onpointerenter={() => (hover = star)}>
				<input type="radio" {name} value={star} bind:group={value} />
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
				<span class="visually-hidden">{star} {star === 1 ? 'star' : 'stars'}</span>
			</label>
		{/each}
	</div>

	{#if value && onclear}
		<button type="button" class="clear" onclick={onclear}>Clear</button>
	{:else if !value}
		<span class="hint" aria-hidden="true">Tap to rate</span>
	{/if}
</div>

<style>
	.rating {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.stars {
		display: flex;
		gap: var(--space-1);
		touch-action: manipulation;
	}
	.star {
		position: relative;
		margin: 0;
		cursor: pointer;
	}
	.star input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}
	.star svg {
		display: block;
		width: 2.5rem;
		height: 2.5rem;
	}
	.star path {
		fill: var(--surface-2);
		stroke: var(--border);
		stroke-width: 1;
		transition: fill 0.1s;
	}
	.star.on path {
		fill: var(--accent);
		stroke: var(--accent);
	}
	.star:has(input:focus-visible) {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}
	.clear,
	.hint {
		margin-left: auto;
		color: var(--muted);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.clear {
		padding: var(--space-1) 0;
		border: 0;
		background: none;
		cursor: pointer;
	}
</style>
