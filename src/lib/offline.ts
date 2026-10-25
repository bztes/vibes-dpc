/** Asks the service worker to cache these pages so they open offline */
export async function cacheForOffline(paths: string[]) {
	if (!('serviceWorker' in navigator)) return;
	// Never resolves during development, where there is no service worker
	const registration = await navigator.serviceWorker.ready;
	registration.active?.postMessage({ type: 'cache-pages', paths });
}
