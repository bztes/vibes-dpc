<script lang="ts">
	import type { Path } from '$app/types';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '#lib/paraglide/runtime.js';
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
	<meta name="theme-color" content="#2a78d6" />
</svelte:head>

{@render children()}

<footer class="mx-auto max-w-7xl px-4 pt-2 pb-8 text-xs text-stone-500 sm:px-6">
	<p>
		<strong class="font-medium text-stone-600">Disclaimer:</strong> This calculator gives a simplified
		steady-state estimate for orientation only. It is no substitute for a professional assessment or a
		hygrothermal simulation, and no liability is accepted for decisions based on its results. It was vibe
		coded – largely written by an AI – so the code and results may contain errors.
	</p>
</footer>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Path)}>{locale}</a>
	{/each}
</div>
