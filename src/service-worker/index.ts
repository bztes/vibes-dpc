/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { self } from '$app/service-worker';
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

// One cache per deployment: cached pages reference the build files of the same version
const CACHE = `cache-${version}`;

/** Absolute pathname of a path relative to the app's base path */
const pathname = (path: string) => new URL(path, self.registration.scope).pathname;

/** Build output and static files, served from the cache */
const ASSETS = [...immutable, ...assets].map((asset) => pathname(asset.path));

const START = pathname('');

/** Pages cached on install so that the calculator opens offline */
const PAGES = [START, pathname('calculator')];

/** Paths that must not be cached: sign-in and admin data are only useful online */
const isPrivate = (pathname: string) => /^\/(?:[a-z]{2}\/)?(?:api|admin)(?:\/|$)/.test(pathname);

/** Fetches pages and stores them, ignoring failures */
async function cachePages(cache: Cache, paths: string[]) {
	await Promise.all(
		paths.map(async (path) => {
			const url = new URL(path, self.location.origin);
			if (url.origin !== self.location.origin || isPrivate(url.pathname)) return;
			try {
				const response = await fetch(url, { credentials: 'same-origin' });
				if (response.ok) await cache.put(url, response);
			} catch {
				// Offline or the page failed – it will be cached on the next visit
			}
		})
	);
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll(ASSETS);
			await cachePages(cache, PAGES);
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key !== CACHE) await caches.delete(key);
			}
		})()
	);
});

// The app asks for pages it will need offline, e.g. all templates and saved build-ups
self.addEventListener('message', (event) => {
	if (event.data?.type !== 'cache-pages' || !Array.isArray(event.data.paths)) return;
	event.waitUntil(caches.open(CACHE).then((cache) => cachePages(cache, event.data.paths)));
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin || isPrivate(url.pathname)) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			if (ASSETS.includes(url.pathname)) {
				const cached = await cache.match(url.pathname);
				if (cached) return cached;
			}

			// Everything else: network first, so pages and data stay current while online
			try {
				const response = await fetch(request);
				if (response.ok && !response.headers.get('cache-control')?.includes('no-store')) {
					void cache.put(request, response.clone());
				}
				return response;
			} catch (error) {
				const cached = await cache.match(request, { ignoreVary: true });
				if (cached) return cached;
				// Unknown pages fall back to the start page
				if (request.mode === 'navigate') {
					const start = await cache.match(START);
					if (start) return start;
				}
				throw error;
			}
		})()
	);
});
