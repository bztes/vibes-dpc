<script lang="ts">
	import { untrack } from 'svelte';
	import { deleteMaterial, saveMaterial } from '#lib/catalog.remote.ts';
	import Button from '#lib/components/ui/Button.svelte';
	import NumberField from '#lib/components/ui/NumberField.svelte';
	import SelectField from '#lib/components/ui/SelectField.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { categoryOrder, categoryStyles } from '#lib/layer-style.ts';
	import type { Material } from '#lib/physics/types.ts';

	interface Props {
		/** Existing material – omit to create a new one */
		material?: Material;
		oncreated?: () => void;
	}

	let { material, oncreated }: Props = $props();

	const blank: Omit<Material, 'id'> = {
		name: '',
		category: 'insulation',
		lambda: 0.04,
		mu: 1,
		thickness: 100,
		ventilated: false
	};

	function toDraft(source: Omit<Material, 'id'>) {
		const { name, category, lambda, mu, thickness, ventilated, note } = source;
		return { name, category, lambda, mu, thickness, ventilated: !!ventilated, note };
	}

	// Editable copy; after saving it matches the refreshed material again
	let draft = $state(untrack(() => toDraft(material ?? blank)));
	let dirty = $derived(!material || JSON.stringify(draft) !== JSON.stringify(toDraft(material)));

	const categories = categoryOrder.map((value) => ({ value, label: categoryStyles[value].label }));

	let busy = $state(false);
	let error = $state('');

	async function save() {
		busy = true;
		error = '';
		try {
			await saveMaterial({ id: material?.id, ...$state.snapshot(draft) });
			oncreated?.();
		} catch (e) {
			error = (e as { body?: { message?: string } }).body?.message ?? 'Saving failed';
		} finally {
			busy = false;
		}
	}

	async function remove() {
		if (
			!material ||
			!confirm(`Delete material “${material.name}”? Templates keep their layer values.`)
		)
			return;
		busy = true;
		try {
			await deleteMaterial(material.id);
		} finally {
			busy = false;
		}
	}
</script>

<form
	class="grid grid-cols-2 items-end gap-2 border-b border-stone-100 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_6.5rem_7rem_6.5rem_auto_auto]"
	onsubmit={(event) => {
		event.preventDefault();
		save();
	}}
>
	<TextField label="Name" class="col-span-2 md:col-span-1" required bind:value={draft.name} />
	<SelectField
		label="Category"
		class="col-span-2 md:col-span-1"
		bind:value={draft.category}
		options={categories}
	/>
	<NumberField label="λ [W/mK]" min={0.001} bind:value={draft.lambda} />
	<NumberField label="μ [–]" min={0} bind:value={draft.mu} />
	<NumberField label="Default [mm]" min={0.01} bind:value={draft.thickness} />
	<label class="flex h-9 items-center gap-2 text-sm text-stone-600">
		<input type="checkbox" bind:checked={draft.ventilated} class="size-4 accent-stone-800" />
		Ventilated
	</label>
	<div class="col-span-2 flex justify-end gap-1 md:col-span-1">
		<Button
			type="submit"
			variant={material ? 'secondary' : 'primary'}
			size="md"
			disabled={busy || !dirty || !draft.name.trim()}
		>
			{material ? 'Save' : 'Add'}
		</Button>
		{#if material}
			<Button
				variant="danger"
				icon="trash"
				label="Delete material"
				disabled={busy}
				onclick={remove}
			/>
		{/if}
	</div>
	{#if error}<p class="col-span-full text-xs text-critical-ink">{error}</p>{/if}
</form>
