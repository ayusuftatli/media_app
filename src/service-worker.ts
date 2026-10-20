/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Registered automatically by SvelteKit. Strategy:
// - app code and static files: precached on install, served from cache
// - pages and their __data.json: network first, last good copy kept for offline
// - covers from TMDB / Open Library: cache first, capped
// - /api/* and anything not GET: straight to the network
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

const sw = self as unknown as ServiceWorkerGlobalScope;

const STATIC_CACHE = `static-${version}`;
// Pages reference this build's JS files, so they're dropped along with them on each deploy
const PAGES_CACHE = `pages-${version}`;
// Cover images don't change between deploys
const COVERS_CACHE = 'covers-v1';

const MAX_PAGES = 60;
const MAX_COVERS = 400;
const COVER_HOSTS = new Set(['image.tmdb.org', 'covers.openlibrary.org']);

const PRECACHE = [...immutable, ...assets].map(({ path }) => new URL(path, sw.location.origin).pathname);
const PRECACHE_SET = new Set(PRECACHE);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	const keep = new Set([STATIC_CACHE, PAGES_CACHE, COVERS_CACHE]);
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);

	if (url.origin === sw.location.origin) {
		if (url.pathname.startsWith('/api/')) return;
		if (PRECACHE_SET.has(url.pathname)) {
			event.respondWith(cacheFirst(request));
		} else if (request.mode === 'navigate' || url.pathname.endsWith('/__data.json')) {
			event.respondWith(networkFirst(request, url));
		}
		return;
	}

	if (request.destination === 'image' && COVER_HOSTS.has(url.hostname)) {
		event.respondWith(cover(request));
	}
});

// ignoreVary: servers may send Vary: Origin, and the page's module script requests carry an
// Origin header that the install-time requests didn't, so a strict match would always miss
const MATCH = { ignoreVary: true } as const;

async function cacheFirst(request: Request) {
	const cached = await caches.match(request.url, { cacheName: STATIC_CACHE, ...MATCH });
	return cached ?? fetch(request);
}

// The invalidation param changes per request, so it's left out of the cache key
function pageKey(url: URL) {
	const key = new URL(url);
	key.searchParams.delete('x-sveltekit-invalidated');
	return key.href;
}

async function networkFirst(request: Request, url: URL) {
	const cache = await caches.open(PAGES_CACHE);
	const key = pageKey(url);

	try {
		const response = await fetch(request);
		// Only keep real pages: not redirects (e.g. to /login after the session expires) or errors
		if (response.ok && response.type === 'basic' && !response.redirected) {
			await cache.put(key, response.clone());
			trim(cache, MAX_PAGES);
		}
		return response;
	} catch {
		const cached = await cache.match(key, MATCH);
		if (cached) return cached;

		if (request.mode === 'navigate') {
			// A page (or filter combination) never opened online: go to the saved list instead
			const isPlainList = url.pathname === '/' && !url.search;
			if (!isPlainList && (await cache.match(new URL('/', url).href, MATCH))) {
				return Response.redirect('/', 302);
			}
			return offlinePage();
		}
		// Missing __data.json: SvelteKit falls back to a full page load, handled above
		return Response.error();
	}
}

async function cover(request: Request) {
	const cache = await caches.open(COVERS_CACHE);
	const cached = await cache.match(request.url, MATCH);
	if (cached) return cached;

	try {
		// Both hosts send CORS headers; a CORS response can be stored at its real size,
		// unlike an opaque one, which browsers pad heavily in storage quota.
		// cache: 'reload' skips the HTTP cache: TMDB only adds the CORS header when the request
		// has an Origin and doesn't send Vary: Origin, so a copy cached from a plain <img> load
		// would come back without it and fail
		const response = await fetch(request.url, {
			mode: 'cors',
			credentials: 'omit',
			cache: 'reload'
		});
		if (response.ok) {
			await cache.put(request.url, response.clone());
			trim(cache, MAX_COVERS);
		}
		return response;
	} catch {
		try {
			return await fetch(request);
		} catch {
			return Response.error();
		}
	}
}

// Drop the oldest entries beyond the limit (keys come back in insertion order)
async function trim(cache: Cache, max: number) {
	const keys = await cache.keys();
	await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

function offlinePage() {
	return new Response(
		`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline · Media Shelf</title>
<body style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center">
<h1>You're offline</h1>
<p>Open Media Shelf once while online and the list will be available offline after that.</p>
</body>`,
		{ status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
	);
}
