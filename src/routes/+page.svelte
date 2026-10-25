<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { getCatalog, getUser } from '#lib/catalog.remote.ts';
	import AppHeader from '#lib/components/AppHeader.svelte';
	import LayerStrip from '#lib/components/LayerStrip.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { cacheForOffline } from '#lib/offline.ts';
	import type { Assembly } from '#lib/physics/types.ts';
	import { readConfigs } from '#lib/wall.svelte.ts';

	let [catalog, user] = $derived(await Promise.all([getCatalog(), getUser()]));

	// Browser storage is only available after hydration
	let ownBuildUps = $state<Assembly[]>([]);
	onMount(() => {
		ownBuildUps = readConfigs();
		// Every build-up can then be opened offline
		void cacheForOffline(
			[...catalog.assemblies, ...ownBuildUps].map((t) =>
				resolve('/calculator/[[id]]', { id: t.id })
			)
		);
	});
</script>

<svelte:head>
	<title>Dew Point Calculator</title>
	<meta
		name="description"
		content="Calculate the dew point and condensation risk inside building envelopes"
	/>
</svelte:head>

<AppHeader {user} />

<main class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
	<div>
		<h1 class="text-2xl font-semibold text-stone-900">Start a calculation</h1>
		<p class="mt-1 text-stone-500">
			Pick a typical house as a starting point, or start from scratch.
		</p>
	</div>

	<section class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold text-stone-900">Templates</h2>
		<ul class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each catalog.assemblies as template (template.id)}
				<li>{@render card(template)}</li>
			{/each}
			<li>
				<a
					href={resolve('/calculator/[[id]]', {})}
					class="flex h-full flex-col justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 p-4 transition hover:border-stone-400 hover:bg-white"
				>
					<span class="grid size-10 place-items-center rounded-xl bg-stone-100 text-stone-600"
						><Icon name="plus" size={20} /></span
					>
					<span>
						<span class="block font-semibold text-stone-900">Empty build-up</span>
						<span class="block text-sm text-stone-500">Add the layers yourself</span>
					</span>
				</a>
			</li>
		</ul>
	</section>

	{#if ownBuildUps.length}
		<section class="flex flex-col gap-4">
			<div>
				<h2 class="text-lg font-semibold text-stone-900">My saved build-ups</h2>
				<p class="text-sm text-stone-500">Stored in this browser</p>
			</div>
			<ul class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{#each ownBuildUps as buildUp (buildUp.id)}
					<li>{@render card(buildUp)}</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>

{#snippet card(template: Assembly)}
	<a
		href={resolve('/calculator/[[id]]', { id: template.id })}
		class="flex h-full flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow-md"
	>
		<div class="flex items-start gap-2">
			<span class="mt-0.5 text-stone-400"><Icon name={template.builtIn ? 'home' : 'layers'} /></span
			>
			<h3 class="flex-1 font-semibold text-stone-900">{template.name}</h3>
		</div>
		<LayerStrip layers={template.layers} />
		{#if template.description}
			<p class="text-sm text-stone-600">{template.description}</p>
		{/if}
	</a>
{/snippet}
