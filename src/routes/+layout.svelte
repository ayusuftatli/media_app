<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { navigating, page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// Loading bar for page changes, shown only if one takes longer than 200 ms
	let loading = $state(false);
	$effect(() => {
		if (!navigating.to) {
			loading = false;
			return;
		}
		const timer = setTimeout(() => (loading = true), 200);
		return () => clearTimeout(timer);
	});

	// Pages come from the service worker's saved copies while offline; saving changes won't work
	let online = $state(true);
	$effect(() => {
		const update = () => (online = navigator.onLine);
		update();
		window.addEventListener('online', update);
		window.addEventListener('offline', update);
		return () => {
			window.removeEventListener('online', update);
			window.removeEventListener('offline', update);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if loading}
	<div class="loading-bar" role="progressbar" aria-label="Loading"></div>
{/if}

{#if data.authenticated}
	<header>
		<a class="brand" href="/">Media Shelf</a>
		<nav>
			<a href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>List</a>
			<a href="/add" aria-current={page.url.pathname.startsWith('/add') ? 'page' : undefined}>Add</a>
			<a href="/stats" aria-current={page.url.pathname === '/stats' ? 'page' : undefined}>Stats</a>
			<form method="POST" action="/logout">
				<button class="link">Log out</button>
			</form>
		</nav>
	</header>
{/if}

{#if !online}
	<p class="offline" role="status">Offline: showing the last saved copy. Changes won't save.</p>
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
		white-space: nowrap;
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
	nav a,
	.link {
		white-space: nowrap;
	}
	/* Four nav items plus the name have to fit a 375px phone */
	@media (max-width: 26rem) {
		header {
			padding-inline: var(--space-3);
		}
		nav {
			gap: 0;
		}
		nav a,
		.link {
			padding-inline: var(--space-2);
		}
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
	.loading-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 20;
		height: 3px;
		overflow: hidden;
		background: var(--accent-soft);
	}
	.loading-bar::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 40%;
		background: var(--accent);
		animation: slide 1s ease-in-out infinite;
	}
	@keyframes slide {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(250%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.loading-bar::after {
			animation: none;
			width: 100%;
			opacity: 0.6;
		}
	}
	.offline {
		margin: 0;
		padding: var(--space-2) var(--space-4);
		background: var(--surface-2);
		color: var(--muted);
		font-size: var(--text-sm);
		text-align: center;
	}
	main {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-4) var(--space-4) var(--space-6);
	}
</style>
