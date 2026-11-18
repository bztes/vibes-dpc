<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { asset } from '$app/paths';
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { cacheForOffline } from '#lib/offline.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Visited pages open offline later
	afterNavigate(({ to }) => {
		if (to && navigator.onLine) void cacheForOffline([to.url.pathname]);
	});

	// Offline, a client-side navigation can't load its data – load the cached page instead
	beforeNavigate(({ type, to, cancel }) => {
		if (navigator.onLine || type !== 'link' || !to) return;
		cancel();
		location.href = to.url.href;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="apple-touch-icon" href={asset('apple-touch-icon.png')} />
	<link rel="manifest" href={asset('manifest.webmanifest')} />
	<meta name="theme-color" content="#f4f4f2" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#0c0d10" media="(prefers-color-scheme: dark)" />
</svelte:head>

{@render children()}
