<script lang="ts">
	import '@fontsource-variable/manrope';
	import '../app.css';
	import Icon from '#lib/components/Icon.svelte';
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

{#if !online}
	<p class="offline" role="status">Offline: showing the last saved copy. Changes won't save.</p>
{/if}

<main class:with-tabs={data.authenticated}>
	{@render children()}
</main>

{#if data.authenticated}
	{@const path = page.url.pathname}
	<!-- Bottom tab bar: in thumb reach on phones. Item pages and Surprise me belong to the shelf -->
	<nav class="tabs" aria-label="Main">
		<a
			href="/"
			aria-current={path === '/' || path.startsWith('/items') || path.startsWith('/pick')
				? 'page'
				: undefined}
		>
			<Icon name="shelf" size={24} />Shelf
		</a>
		<a href="/add" aria-current={path.startsWith('/add') ? 'page' : undefined}>
			<Icon name="add" size={24} />Add
		</a>
		<a
			href="/stats"
			aria-current={path === '/stats' || path === '/about' ? 'page' : undefined}
		>
			<Icon name="stats" size={24} />Stats
		</a>
	</nav>
{/if}

<style>
	.tabs {
		position: fixed;
		inset: auto 0 0;
		z-index: 10;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		padding: var(--space-2) var(--space-3) calc(var(--space-2) + env(safe-area-inset-bottom));
		background: var(--bar);
		border-top: 1px solid var(--border);
	}
	.tabs a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		min-height: 3.25rem;
		justify-content: center;
		color: var(--muted);
		text-decoration: none;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.tabs a[aria-current='page'] {
		color: var(--accent);
		font-weight: 800;
	}
	@media (min-width: 40rem) {
		.tabs {
			grid-template-columns: repeat(3, 8rem);
			justify-content: center;
		}
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
		--gutter: var(--space-5);
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-4) var(--gutter) var(--space-6);
	}
	main.with-tabs {
		padding-bottom: calc(var(--tabbar-height) + var(--space-6) + env(safe-area-inset-bottom));
	}
	@media (max-width: 26rem) {
		main {
			--gutter: var(--space-4);
		}
	}
</style>
