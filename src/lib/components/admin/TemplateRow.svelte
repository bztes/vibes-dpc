<script lang="ts">
	import { resolve } from '$app/paths';
	import { deleteAssembly, saveAssembly } from '#lib/catalog.remote.ts';
	import Badge from '#lib/components/ui/Badge.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { categoryStyles } from '#lib/layer-style.ts';
	import type { Assembly } from '#lib/physics/types.ts';

	interface Props {
		template: Assembly;
	}

	let { template }: Props = $props();

	const initial = () => ({
		name: template.name,
		description: template.description,
		keywords: [...template.keywords]
	});

	// Editable copy; after saving it matches the refreshed template again
	let draft = $state(initial());
	let dirty = $derived(JSON.stringify(draft) !== JSON.stringify(initial()));
	let busy = $state(false);

	async function save() {
		busy = true;
		try {
			await saveAssembly({
				id: template.id,
				name: draft.name,
				description: draft.description,
				keywords: draft.keywords,
				layers: template.layers
			});
		} finally {
			busy = false;
		}
	}

	async function remove() {
		if (!confirm(`Delete template “${template.name}”?`)) return;
		busy = true;
		try {
			await deleteAssembly(template.id);
		} finally {
			busy = false;
		}
	}
</script>

<form
	class="flex flex-col gap-3 border-b border-stone-100 py-4"
	onsubmit={(event) => {
		event.preventDefault();
		save();
	}}
>
	<div
		class="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.5fr)_auto]"
	>
		<TextField label="Name" required bind:value={draft.name} />
		<TextField label="Description" bind:value={draft.description} />
		<TagInput label="Tags" placeholder="Sweden, Germany …" bind:tags={draft.keywords} />
		<div class="flex gap-1">
			<Button type="submit" disabled={busy || !dirty || !draft.name.trim()}>Save</Button>
			<a
				href={resolve('/calculator/[[id]]', { id: template.id })}
				class="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
			>
				Edit layers
			</a>
			<Button
				variant="danger"
				icon="trash"
				label="Delete template"
				disabled={busy}
				onclick={remove}
			/>
		</div>
	</div>
	<div class="flex flex-wrap items-center gap-1.5">
		{#if template.builtIn}<Badge>example</Badge>{/if}
		{#each template.layers as layer, i (i)}
			<span
				class="rounded-md px-1.5 py-0.5 text-[11px] text-stone-700"
				style:background={categoryStyles[layer.category].fill}
				style:color={layer.category === 'membrane' ? '#fff' : undefined}
			>
				{layer.name} · {layer.thickness} mm
			</span>
		{/each}
	</div>
</form>
