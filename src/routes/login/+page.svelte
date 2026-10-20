<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Log in · Media Shelf</title>
</svelte:head>

<div class="login">
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
		<div>
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
				<p id="password-error" class="field-error">Wrong password.</p>
			{/if}
		</div>
		<button class="button primary" disabled={submitting}>
			{submitting ? 'Checking…' : 'Log in'}
		</button>
	</form>
</div>

<style>
	.login {
		max-width: 22rem;
		margin: 18vh auto 0;
	}
	h1 {
		margin-bottom: var(--space-5);
	}
	form {
		display: grid;
		gap: var(--space-4);
	}
</style>
