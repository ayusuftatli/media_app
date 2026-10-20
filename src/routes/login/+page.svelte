<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Log in · Media Shelf</title>
</svelte:head>

<main>
	<h1>Media Shelf</h1>
	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<label for="password">Password</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			id="password"
			name="password"
			type="password"
			autocomplete="current-password"
			required
			autofocus
			aria-invalid={form?.incorrect ? 'true' : undefined}
			aria-describedby={form?.incorrect ? 'password-error' : undefined}
		/>
		{#if form?.incorrect}
			<p id="password-error" class="error">Wrong password.</p>
		{/if}
		<button disabled={submitting}>{submitting ? 'Checking…' : 'Log in'}</button>
	</form>
</main>

<style>
	main {
		max-width: 22rem;
		margin: 20vh auto 0;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
	}
	form {
		display: grid;
		gap: 0.5rem;
	}
	input,
	button {
		font: inherit;
		padding: 0.6rem 0.75rem;
	}
	.error {
		color: #b00020;
		margin: 0;
	}
</style>
