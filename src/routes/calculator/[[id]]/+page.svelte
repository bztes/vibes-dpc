<script lang="ts">
	import { page } from '$app/state';
	import { getCatalog, getUser } from '#lib/catalog.remote.ts';
	import AppHeader from '#lib/components/AppHeader.svelte';
	import Calculator from '#lib/components/Calculator.svelte';

	let [catalog, user] = $derived(await Promise.all([getCatalog(), getUser()]));
</script>

<svelte:head>
	<title>Calculator · Dew Point Calculator</title>
</svelte:head>

<AppHeader {user} />

<!-- Without an id the calculator starts with an empty build-up -->
<Calculator {catalog} admin={!!user?.admin} templateId={page.params.id} />
