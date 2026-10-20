<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.authenticated}
	<header>
		<a class="brand" href="/">Media Shelf</a>
		<nav>
			<a href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>List</a>
			<a href="/add" aria-current={page.url.pathname === '/add' ? 'page' : undefined}>Add</a>
			<form method="POST" action="/logout">
				<button class="link">Log out</button>
			</form>
		</nav>
	</header>
{/if}

<main>
	{@render children()}
</main>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-4);
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}
	.brand {
		font-weight: 700;
		color: var(--text);
		text-decoration: none;
	}
	nav {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}
	nav a,
	.link {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--muted);
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 600;
	}
	nav a[aria-current='page'] {
		color: var(--text);
		background: var(--surface-2);
	}
	.link {
		background: none;
		border: 0;
		cursor: pointer;
		font-size: var(--text-sm);
	}
	main {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-4) var(--space-4) var(--space-6);
	}
</style>
