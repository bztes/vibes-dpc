<!--
	Shared by `/[[id]]` (templates and build-ups in the user's account) and `/local/[id]` (build-ups
	saved in this browser), so the calculator stays mounted when a build-up is saved and its URL
	changes
-->
<script lang="ts">
	import { page } from '$app/state';
	import { getCatalog, getUser } from '#lib/catalog.remote.ts';
	import Calculator from '#lib/components/Calculator.svelte';
	import { getConfigs } from '#lib/configs.remote.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	let [catalog, user, configs] = $derived(
		await Promise.all([getCatalog(), getUser(), getConfigs()])
	);
</script>

<svelte:head>
	<title>Dew Point Calculator</title>
	<meta
		name="description"
		content="Calculate the dew point and condensation risk inside building envelopes"
	/>
</svelte:head>

<!-- Without an id the calculator starts with an empty build-up -->
<Calculator {catalog} {user} {configs} templateId={page.params.id} />

<!-- The pages are empty -->
{@render children()}
