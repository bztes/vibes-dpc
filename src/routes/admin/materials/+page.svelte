<script lang="ts">
	import { deleteMaterial, getCatalog, saveMaterial } from '#lib/catalog.remote.ts';
	import PageHeader from '#lib/components/admin/PageHeader.svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import NumberField from '#lib/components/ui/NumberField.svelte';
	import SearchField from '#lib/components/ui/SearchField.svelte';
	import SelectField from '#lib/components/ui/SelectField.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { errorMessage } from '#lib/errors.ts';
	import { fmt, searchMatcher } from '#lib/format.ts';
	import { categoryOrder, categoryStyles } from '#lib/layer-style.ts';
	import type { Material, MaterialCategory } from '#lib/physics/types.ts';

	let catalog = $derived(await getCatalog());

	let search = $state('');
	let category = $state<MaterialCategory | ''>('');

	let matcher = $derived(searchMatcher(search));
	let materials = $derived(
		catalog.materials
			.filter(
				(m) =>
					(!category || m.category === category) &&
					matcher(`${m.name} ${categoryStyles[m.category].label} ${m.note ?? ''}`)
			)
			.toSorted(
				(a, b) =>
					categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) ||
					a.name.localeCompare(b.name)
			)
	);

	let counts = $derived(
		Object.groupBy(catalog.materials, (m) => m.category) as Partial<
			Record<MaterialCategory, Material[]>
		>
	);

	const categories = categoryOrder.map((value) => ({ value, label: categoryStyles[value].label }));

	let busy = $state(false);
	let error = $state('');

	async function run(action: () => Promise<unknown>) {
		busy = true;
		error = '';
		try {
			await action();
			return true;
		} catch (e) {
			error = errorMessage(e, 'Saving failed');
			return false;
		} finally {
			busy = false;
		}
	}

	// ─── Add / edit ───
	type Draft = Omit<Material, 'id' | 'ventilated'> & { ventilated: boolean };

	let editDialog = $state<Dialog>();
	let editing = $state<Material>();
	let draft = $state<Draft>(blank());

	function blank(): Draft {
		return {
			name: '',
			category: category || 'insulation',
			lambda: 0.04,
			mu: 1,
			thickness: 100,
			ventilated: false,
			note: null
		};
	}

	function edit(material?: Material) {
		editing = material;
		draft = material
			? {
					name: material.name,
					category: material.category,
					lambda: material.lambda,
					mu: material.mu,
					thickness: material.thickness,
					ventilated: !!material.ventilated,
					note: material.note ?? null
				}
			: blank();
		error = '';
		editDialog?.open();
	}

	// ─── Delete ───
	let deleteDialog = $state<Dialog>();
	let deleteTarget = $state<Material>();
</script>

<PageHeader
	title="Materials"
	description="{catalog.materials
		.length} materials. Values are copied into a layer when it is picked, so changes only apply to new layers."
>
	{#snippet actions()}
		<Button variant="accent" icon="plus" onclick={() => edit()}>Add material</Button>
	{/snippet}
</PageHeader>

<div class="flex flex-col gap-3">
	<SearchField bind:value={search} placeholder="Search materials …" class="w-full sm:w-80" />
	<div
		class="-mx-4 flex scroll-thin gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
	>
		{#snippet chip(value: MaterialCategory | '', label: string, n: number, fill?: string)}
			<button
				type="button"
				aria-pressed={category === value}
				onclick={() => (category = value)}
				class={[
					'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap ring-1 transition',
					category === value
						? 'bg-inverse text-inverse-fg ring-inverse'
						: 'bg-surface text-fg-muted ring-line hover:text-fg hover:ring-line-strong'
				]}
			>
				{#if fill}<span class="size-2 rounded-full ring-1 ring-black/10" style:background={fill}
					></span>{/if}
				{label}
				<span class="tabular-nums opacity-60">{n}</span>
			</button>
		{/snippet}
		{@render chip('', 'All', catalog.materials.length)}
		{#each categoryOrder as value (value)}
			{#if counts[value]?.length}
				{@render chip(
					value,
					categoryStyles[value].label,
					counts[value].length,
					categoryStyles[value].fill
				)}
			{/if}
		{/each}
	</div>
</div>

{#if error}<p class="text-sm text-critical-ink" role="alert">{error}</p>{/if}

<div class="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-line bg-surface-2 text-xs text-fg-muted">
				<tr>
					<th class="px-5 py-2.5 font-medium">Name</th>
					<th class="hidden px-3 py-2.5 font-medium md:table-cell">Category</th>
					<th class="px-3 py-2.5 text-right font-medium"
						>λ <span class="text-fg-subtle">W/mK</span></th
					>
					<th class="px-3 py-2.5 text-right font-medium">μ</th>
					<th class="hidden px-3 py-2.5 text-right font-medium sm:table-cell">
						Default <span class="text-fg-subtle">mm</span>
					</th>
					<th class="w-24 px-3 py-2.5"><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-line">
				{#each materials as material (material.id)}
					<tr class="group transition-colors hover:bg-surface-2/60">
						<td class="px-5 py-2.5">
							<button
								type="button"
								onclick={() => edit(material)}
								class="flex items-center gap-3 text-left focus-visible:outline-none"
							>
								<span
									class="size-3 shrink-0 rounded ring-1 ring-black/10"
									style:background={categoryStyles[material.category].fill}
								></span>
								<span class="font-medium group-hover:underline">{material.name}</span>
								{#if material.ventilated}<Badge tone="info" icon="wind">Ventilated</Badge>{/if}
							</button>
						</td>
						<td class="hidden px-3 py-2.5 text-fg-muted md:table-cell">
							{categoryStyles[material.category].label}
						</td>
						<td class="px-3 py-2.5 text-right tabular-nums">{fmt(material.lambda, 3)}</td>
						<td class="px-3 py-2.5 text-right tabular-nums">
							{material.mu >= 1000 ? material.mu.toLocaleString('en-GB') : material.mu}
						</td>
						<td class="hidden px-3 py-2.5 text-right text-fg-muted tabular-nums sm:table-cell">
							{material.thickness}
						</td>
						<td class="px-3 py-1.5">
							<div
								class="flex justify-end gap-0.5 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
							>
								<Button
									variant="ghost"
									icon="edit"
									label="Edit {material.name}"
									onclick={() => edit(material)}
								/>
								<Button
									variant="danger"
									icon="trash"
									label="Delete {material.name}"
									disabled={busy}
									onclick={() => {
										deleteTarget = material;
										error = '';
										deleteDialog?.open();
									}}
								/>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="px-5 py-12 text-center text-sm text-fg-muted">
							No materials match your search.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<Dialog
	bind:this={editDialog}
	onclose={() => (error = '')}
	title={editing ? 'Edit material' : 'Add material'}
	subtitle={editing ? 'Existing layers keep their values.' : undefined}
	icon={editing ? 'edit' : 'plus'}
	size="lg"
>
	<form
		id="edit-material"
		class="grid grid-cols-2 gap-3 sm:grid-cols-3"
		onsubmit={async (event) => {
			event.preventDefault();
			const saved = await run(() =>
				saveMaterial({ id: editing?.id, ...$state.snapshot(draft), name: draft.name.trim() })
			);
			if (saved) editDialog?.close();
		}}
	>
		<TextField label="Name" class="col-span-2" required maxlength={120} bind:value={draft.name} />
		<SelectField
			label="Category"
			class="col-span-2 sm:col-span-1"
			bind:value={draft.category}
			options={categories}
		/>
		<NumberField label="Thermal conductivity λ" unit="W/mK" min={0.001} bind:value={draft.lambda} />
		<NumberField label="Vapour resistance μ" min={0} bind:value={draft.mu} />
		<NumberField
			label="Default thickness"
			unit="mm"
			min={0.01}
			class="col-span-2 sm:col-span-1"
			bind:value={draft.thickness}
		/>
		<label
			class="col-span-full flex cursor-pointer items-start justify-between gap-4 rounded-lg bg-surface-2 px-4 py-3 ring-1 ring-line"
		>
			<span>
				<span class="block text-sm font-medium">Ventilated air layer</span>
				<span class="block text-xs text-fg-muted">
					This and all layers outside it are ignored in the calculation.
				</span>
			</span>
			<input type="checkbox" role="switch" class="switch mt-0.5" bind:checked={draft.ventilated} />
		</label>
		{#if error}<p class="col-span-full text-sm text-critical-ink">{error}</p>{/if}
	</form>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => editDialog?.close()}>Cancel</Button>
		<Button
			type="submit"
			form="edit-material"
			variant="accent"
			disabled={busy || !draft.name.trim()}
		>
			{editing ? 'Save' : 'Add material'}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	bind:this={deleteDialog}
	onclose={() => (error = '')}
	size="sm"
	tone="critical"
	icon="trash"
	title="Delete “{deleteTarget?.name}”?"
	subtitle="Templates using it keep their layer values."
>
	{#if error}<p class="text-sm text-critical-ink">{error}</p>{/if}
	{#snippet actions()}
		<Button variant="ghost" onclick={() => deleteDialog?.close()}>Cancel</Button>
		<Button
			variant="critical"
			icon="trash"
			disabled={busy}
			onclick={async () => {
				if (await run(() => deleteMaterial(deleteTarget!.id))) deleteDialog?.close();
			}}
		>
			Delete
		</Button>
	{/snippet}
</Dialog>
