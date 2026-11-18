<script lang="ts">
	import Badge from '#lib/components/ui/Badge.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import MaterialPicker from '#lib/components/MaterialPicker.svelte';
	import NumberField from '#lib/components/ui/NumberField.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { categoryStyles, inkOn } from '#lib/layer-style.ts';
	import { fmt, fmtSd } from '#lib/format.ts';
	import type { Layer } from '#lib/physics/types.ts';
	import { fromMaterial, getWall } from '#lib/wall.svelte.ts';

	const wall = getWall();

	/**
	 * The layer dialog edits a layer of the build-up in place, or a new layer that is only
	 * inserted at `index` once confirmed; its `layer` is empty until a material is chosen
	 */
	type Target = { mode: 'edit'; id: string } | { mode: 'add'; index: number; layer?: Layer };

	let dialog = $state<Dialog>();
	let target = $state<Target>();
	let editIndex = $derived.by(() => {
		const id = target?.mode === 'edit' ? target.id : undefined;
		return wall.layers.findIndex((layer) => layer.id === id);
	});
	let layer = $derived(target?.mode === 'add' ? target.layer : wall.layers[editIndex]);

	function edit(id: string) {
		target = { mode: 'edit', id };
		dialog?.open();
	}

	/** Inserts before `index`, by default on the outside */
	function add(index = wall.layers.length) {
		target = { mode: 'add', index };
		dialog?.open();
	}

	function confirmAdd() {
		if (target?.mode !== 'add' || !target.layer) return;
		wall.addLayer(target.layer, target.index);
		dialog?.close();
	}

	function chooseMaterial(materialId: string) {
		if (target?.mode === 'edit') return wall.replaceMaterial(editIndex, materialId);
		const material = wall.material(materialId);
		if (target && material) target.layer = fromMaterial(material);
	}

	function remove(index: number) {
		dialog?.close();
		wall.removeLayer(index);
	}

	function insertLabel(index: number) {
		if (index === 0) return 'Add layer on the inside';
		if (index === wall.layers.length) return 'Add layer on the outside';
		return `Add layer between ${index} and ${index + 1}`;
	}

	// Drag and drop starts at the grip only, so text in the inputs stays selectable
	let dragIndex = $state<number>();
	/** Gap the dragged layer would be dropped into: 0 is before the first layer */
	let dropGap = $state<number>();
	/** Dropping next to the dragged layer changes nothing */
	let showGap = $derived(
		dragIndex !== undefined &&
			dropGap !== undefined &&
			dropGap !== dragIndex &&
			dropGap !== dragIndex + 1
	);

	function dragOver(event: DragEvent, index: number) {
		if (dragIndex === undefined) return;
		event.preventDefault();
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		dropGap = index + (event.clientY > box.top + box.height / 2 ? 1 : 0);
	}

	function drop() {
		if (dragIndex !== undefined && dropGap !== undefined) {
			wall.moveLayerTo(dragIndex, dropGap > dragIndex ? dropGap - 1 : dropGap);
		}
		endDrag();
	}

	function endDrag() {
		dragIndex = dropGap = undefined;
	}

	/** Editing material values turns the layer into a custom material */
	function customize(layer: Layer, key: 'lambda' | 'mu', value: number) {
		layer[key] = value;
		layer.material = undefined;
	}
</script>

<!-- Small plus on the border between two layers; inserts before `index` -->
{#snippet inserter(index: number, edge: 'top' | 'bottom')}
	{#if dragIndex === undefined}
		{@const label = insertLabel(index)}
		<div
			class={[
				'group/gap absolute inset-x-0 z-10 flex h-5 items-center justify-center',
				edge === 'top' ? '-top-2.5' : '-bottom-2.5'
			]}
		>
			<span
				class="pointer-events-none absolute inset-x-3 top-1/2 h-px bg-accent opacity-0 transition group-focus-within/gap:opacity-100 group-hover/gap:opacity-100"
			></span>
			<button
				type="button"
				aria-haspopup="dialog"
				aria-label={label}
				title={label}
				onclick={() => add(index)}
				class="relative grid size-5 place-items-center rounded-full bg-surface text-fg-subtle ring-1 ring-line-strong transition outline-none hover:text-accent hover:ring-accent focus-visible:ring-2 focus-visible:ring-accent pointer-coarse:size-6"
			>
				<Icon name="plus" size={12} strokeWidth={2.5} />
			</button>
		</div>
	{/if}
{/snippet}

<div class="flex flex-col py-8">
	<ol class="flex flex-col border-y border-line">
		{#each wall.layers as layer, i (layer.id)}
			{@const style = categoryStyles[layer.category]}
			{@const activeIndex = wall.activeLayers.indexOf(layer)}
			{@const inactive = activeIndex < 0 || activeIndex >= wall.result.activeCount}
			{@const materialName = wall.materials.find((m) => m.id === layer.material)?.name}
			<li
				ondragover={(event) => dragOver(event, i)}
				ondrop={(event) => {
					event.preventDefault();
					drop();
				}}
				class={[
					'group relative border-b border-line transition-colors last:border-b-0 hover:bg-surface-2/70',
					dragIndex === i && 'opacity-40'
				]}
			>
				{@render inserter(i, 'top')}
				{#if i === wall.layers.length - 1}{@render inserter(i + 1, 'bottom')}{/if}

				{#if showGap && dropGap === i}
					<span class="absolute inset-x-2 -top-1 h-0.5 rounded bg-accent"></span>
				{:else if showGap && dropGap === i + 1 && i === wall.layers.length - 1}
					<span class="absolute inset-x-2 -bottom-1 h-0.5 rounded bg-accent"></span>
				{/if}

				<div
					class={[
						'flex items-center gap-2 py-2 pr-2 pl-3 lg:pl-4',
						layer.disabled ? 'opacity-45' : inactive && !layer.ventilated && 'opacity-60'
					]}
				>
					<!-- Drag to reorder, or focus and use the arrow keys; touch screens use the move buttons -->
					<button
						type="button"
						title="Drag to reorder"
						aria-label="Move layer {i + 1} (arrow keys)"
						draggable="true"
						class="-mr-1 hidden h-8 cursor-grab items-center rounded text-fg-subtle opacity-0 transition group-hover:opacity-100 hover:text-fg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:cursor-grabbing pointer-fine:flex"
						onkeydown={(event) => {
							const direction = { ArrowUp: -1, ArrowDown: 1 }[event.key] as -1 | 1 | undefined;
							if (!direction) return;
							event.preventDefault();
							wall.moveLayer(i, direction);
						}}
						ondragstart={(event) => {
							dragIndex = i;
							const card = (event.currentTarget as HTMLElement).closest('li')!;
							event.dataTransfer?.setData('text/plain', layer.name);
							event.dataTransfer?.setDragImage(card, 20, 20);
							if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
						}}
						ondragend={endDrag}
					>
						<Icon name="grip" size={14} />
					</button>

					<button
						type="button"
						aria-haspopup="dialog"
						aria-label="Layer {i + 1}: {layer.name} – edit"
						onclick={() => edit(layer.id)}
						class="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						<span
							class="grid size-7 shrink-0 place-items-center rounded-md text-[11px] font-bold tabular-nums ring-1 ring-black/10 ring-inset"
							style:background={style.fill}
							style:color={inkOn(style.fill)}
						>
							{i + 1}
						</span>
						<span class="min-w-0 flex-1">
							<span
								class={[
									'block truncate text-[13px] leading-tight font-medium',
									layer.disabled && 'line-through'
								]}
							>
								{layer.name}
							</span>
							<span class="flex items-center gap-1.5 text-[11px] leading-tight text-fg-subtle">
								{#if layer.disabled}
									<Badge>off</Badge>
								{:else if layer.ventilated}
									<Badge tone="info" icon="wind">ventilated</Badge>
								{:else if inactive}
									<Badge>not effective</Badge>
								{/if}
								<span class="truncate">{materialName ?? 'Custom material'}</span>
							</span>
						</span>
					</button>

					<NumberField
						label="Thickness of layer {i + 1}"
						hideLabel
						compact
						unit="mm"
						min={0.01}
						max={5000}
						class="w-[5.25rem] shrink-0"
						bind:value={layer.thickness}
					/>

					<button
						type="button"
						title={layer.disabled ? 'Activate layer' : 'Deactivate layer'}
						aria-label="Layer {i + 1} active"
						aria-pressed={!layer.disabled}
						onclick={() => wall.toggleLayer(i)}
						class="grid size-8 shrink-0 place-items-center rounded-lg text-fg-subtle transition hover:bg-surface-3 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
					>
						<Icon name={layer.disabled ? 'eyeOff' : 'eye'} size={15} />
					</button>
				</div>
			</li>
		{:else}
			<li class="flex flex-col items-center gap-3 px-4 py-8 text-center text-sm text-fg-muted">
				<Icon name="layers" size={20} class="text-fg-subtle" />
				No layers yet – add the innermost material first.
				<button
					type="button"
					aria-haspopup="dialog"
					onclick={() => add()}
					class="flex h-11 w-full items-center gap-2 px-4 text-left text-sm font-medium text-accent transition outline-none hover:bg-accent/6 focus-visible:ring-4 focus-visible:ring-accent/25"
				>
					<Icon name="plus" size={15} />
					Add first layer
				</button>
			</li>
		{/each}
	</ol>
</div>

<Dialog
	bind:this={dialog}
	title={target?.mode === 'add'
		? insertLabel(target.index)
		: editIndex >= 0
			? `Layer ${editIndex + 1}`
			: 'Layer'}
	subtitle={!layer
		? 'Choose a material, then adjust its values.'
		: layer.material
			? 'From the material library'
			: 'Custom material'}
	icon={target?.mode === 'add' ? 'plus' : 'layers'}
	class="sm:overflow-visible!"
	onclose={() => (target = undefined)}
>
	<div class="flex flex-col gap-3">
		<MaterialPicker
			label="Material"
			materials={wall.materials}
			value={layer?.material}
			placeholder={layer ? 'Custom material' : 'Choose a material'}
			onselect={chooseMaterial}
		/>
		{#if layer}
			<TextField label="Name" bind:value={layer.name} />
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
				<NumberField
					label="Thickness"
					class="max-sm:col-span-2"
					unit="mm"
					min={0.01}
					max={5000}
					bind:value={layer.thickness}
				/>
				<NumberField
					label="λ conductivity"
					unit="W/mK"
					min={0.001}
					bind:value={() => layer.lambda, (v) => customize(layer, 'lambda', v)}
				/>
				<NumberField
					label="μ diffusion resist."
					min={0}
					bind:value={() => layer.mu, (v) => customize(layer, 'mu', v)}
				/>
			</div>
			<p class="text-xs text-fg-subtle tabular-nums">
				sd = {fmtSd((layer.mu * layer.thickness) / 1000)} m · R = {fmt(
					layer.thickness / 1000 / layer.lambda,
					3
				)} m²K/W
				{#if layer.ventilated}· this and all outer layers are ignored{/if}
			</p>
		{/if}
	</div>

	{#snippet actions()}
		{#if target?.mode === 'add'}
			<Button variant="ghost" onclick={() => dialog?.close()}>Cancel</Button>
			<Button variant="primary" icon="plus" disabled={!layer} onclick={confirmAdd}>
				Add layer
			</Button>
		{:else}
			<div class="mr-auto flex flex-wrap items-center gap-1">
				<Button
					size="sm"
					variant="ghost"
					icon="up"
					label="Move layer inwards"
					disabled={editIndex <= 0}
					onclick={() => wall.moveLayer(editIndex, -1)}
				/>
				<Button
					size="sm"
					variant="ghost"
					icon="down"
					label="Move layer outwards"
					disabled={editIndex < 0 || editIndex === wall.layers.length - 1}
					onclick={() => wall.moveLayer(editIndex, 1)}
				/>
				<Button size="sm" variant="ghost" icon="copy" onclick={() => wall.duplicateLayer(editIndex)}
					>Duplicate</Button
				>
				<Button size="sm" variant="danger" icon="trash" onclick={() => remove(editIndex)}
					>Remove</Button
				>
			</div>
			<Button variant="primary" onclick={() => dialog?.close()}>Done</Button>
		{/if}
	{/snippet}
</Dialog>
