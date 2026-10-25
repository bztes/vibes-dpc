<script lang="ts">
	import { getCatalog, getUser } from '#lib/catalog.remote.ts';
	import AppHeader from '#lib/components/AppHeader.svelte';
	import MaterialRow from '#lib/components/admin/MaterialRow.svelte';
	import TemplateRow from '#lib/components/admin/TemplateRow.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import { categoryOrder } from '#lib/layer-style.ts';

	let [catalog, user] = $derived(await Promise.all([getCatalog(), getUser()]));

	let materials = $derived(
		catalog.materials.toSorted(
			(a, b) =>
				categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) ||
				a.name.localeCompare(b.name)
		)
	);
	// Bumped after creating a material so the "new" row resets
	let newKey = $state(0);
</script>

<svelte:head><title>Admin · Dew Point Calculator</title></svelte:head>

<AppHeader {user} />

<main class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
	<div>
		<h1 class="text-xl font-semibold text-stone-900">Admin</h1>
		<p class="text-sm text-stone-500">Signed in as {user?.name} ({user?.email})</p>
	</div>

	<Card
		title="Templates"
		subtitle="To change the layers of a template, open it in the calculator, edit it and click “Save”."
		icon="layers"
	>
		{#each catalog.assemblies as template (template.id)}
			<TemplateRow {template} />
		{:else}
			<p class="text-sm text-stone-500">No templates yet. Use “Duplicate” in the calculator.</p>
		{/each}
	</Card>

	<Card
		title="Materials"
		subtitle="{materials.length} materials · values are copied into layers when selected"
	>
		<div class="rounded-xl bg-stone-50 px-3">
			{#key newKey}
				<MaterialRow oncreated={() => newKey++} />
			{/key}
		</div>
		{#each materials as material (material.id)}
			<MaterialRow {material} />
		{/each}
	</Card>
</main>
