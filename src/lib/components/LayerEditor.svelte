<script lang="ts">
	import Badge from '#lib/components/ui/Badge.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import MaterialPicker from '#lib/components/MaterialPicker.svelte';
	import NumberField from '#lib/components/ui/NumberField.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { categoryStyles } from '#lib/layer-style.ts';
	import { fmt, fmtSd } from '#lib/format.ts';
	import { getWall } from '#lib/wall.svelte.ts';

	const wall = getWall();

	let expanded = $state<Record<string, boolean>>({});

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
	function customize(index: number, key: 'lambda' | 'mu', value: number) {
		const layer = wall.layers[index];
		layer[key] = value;
		layer.material = undefined;
	}
</script>

<div class="flex flex-col gap-2">
	<div
		class="flex items-center justify-between px-1 text-[11px] font-semibold tracking-wide text-stone-400 uppercase"
	>
		<span>Inside (warm)</span>
		<span>{wall.layers.length} layers · {fmt(wall.result.totalThickness, 0)} mm</span>
	</div>

	<ol class="flex flex-col gap-2">
		{#each wall.layers as layer, i (layer.id)}
			{@const style = categoryStyles[layer.category]}
			{@const activeIndex = wall.activeLayers.indexOf(layer)}
			{@const inactive = activeIndex < 0 || activeIndex >= wall.result.activeCount}
			<li
				ondragover={(event) => dragOver(event, i)}
				ondrop={(event) => {
					event.preventDefault();
					drop();
				}}
				class={[
					'relative rounded-xl border border-stone-200 bg-white p-3 transition-opacity',
					layer.disabled ? 'opacity-50' : inactive && !layer.ventilated && 'opacity-60',
					dragIndex === i && 'opacity-40'
				]}
				style:border-left="6px solid {style.fill}"
			>
				{#if showGap && dropGap === i}
					<span class="absolute inset-x-0 -top-1.5 h-0.5 rounded bg-sky-500"></span>
				{:else if showGap && dropGap === i + 1 && i === wall.layers.length - 1}
					<span class="absolute inset-x-0 -bottom-1.5 h-0.5 rounded bg-sky-500"></span>
				{/if}
				<div class="flex items-center gap-2">
					<!-- Drag to reorder, or focus and use the arrow keys -->
					<button
						type="button"
						title="Drag to reorder"
						aria-label="Move layer {i + 1} (arrow keys)"
						draggable="true"
						class="-ml-1 cursor-grab rounded text-stone-400 hover:text-stone-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none active:cursor-grabbing"
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
						<Icon name="grip" size={16} />
					</button>
					<span
						class={[
							'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
							inactive ? 'bg-stone-200 text-stone-600' : 'bg-stone-800 text-white'
						]}
					>
						{i + 1}
					</span>
					<span
						class={[
							'min-w-0 flex-1 truncate text-sm font-medium text-stone-800',
							layer.disabled && 'line-through'
						]}
						title={layer.name}
					>
						{layer.name}
					</span>
					{#if layer.disabled}
						<Badge>deactivated</Badge>
					{:else if layer.ventilated}
						<Badge tone="info" icon="wind">ventilated</Badge>
					{:else if inactive}
						<Badge>not effective</Badge>
					{/if}
					<div class="flex shrink-0 items-center">
						<input
							type="checkbox"
							role="switch"
							title={layer.disabled ? 'Activate layer' : 'Deactivate layer'}
							aria-label="Layer {i + 1} active"
							checked={!layer.disabled}
							onchange={() => wall.toggleLayer(i)}
							class="mx-1.5 size-4 accent-stone-800"
						/>
						<Button
							variant="ghost"
							size="sm"
							icon="copy"
							label="Duplicate layer"
							onclick={() => wall.duplicateLayer(i)}
						/>
						<Button
							variant="ghost"
							size="sm"
							icon="sliders"
							label="Edit material values"
							aria-expanded={!!expanded[layer.id]}
							onclick={() => (expanded[layer.id] = !expanded[layer.id])}
						/>
						<Button
							variant="danger"
							size="sm"
							icon="trash"
							label="Remove layer"
							onclick={() => wall.removeLayer(i)}
						/>
					</div>
				</div>

				<div class="mt-2.5 grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
					<MaterialPicker
						label="Material"
						materials={wall.materials}
						value={layer.material}
						placeholder="Custom material"
						onselect={(id) => wall.replaceMaterial(i, id)}
					/>
					<NumberField
						label="Thickness"
						hideLabel
						unit="mm"
						min={0.01}
						max={5000}
						bind:value={layer.thickness}
					/>
				</div>

				{#if expanded[layer.id]}
					<div class="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-stone-50 p-3">
						<TextField label="Name" class="col-span-2" bind:value={layer.name} />
						<NumberField
							label="λ conductivity"
							unit="W/mK"
							min={0.001}
							bind:value={() => layer.lambda, (v) => customize(i, 'lambda', v)}
						/>
						<NumberField
							label="μ diffusion resistance"
							min={0}
							bind:value={() => layer.mu, (v) => customize(i, 'mu', v)}
						/>
						<p class="col-span-2 text-xs text-stone-500">
							sd = {fmtSd((layer.mu * layer.thickness) / 1000)} m · R = {fmt(
								layer.thickness / 1000 / layer.lambda,
								3
							)} m²K/W
							{#if layer.ventilated}· this and all outer layers are ignored{/if}
						</p>
					</div>
				{/if}
			</li>
		{:else}
			<li
				class="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500"
			>
				No layers yet – add a material below.
			</li>
		{/each}
	</ol>

	<div class="px-1 text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
		Outside (cold)
	</div>

	<MaterialPicker
		label="Add layer"
		variant="add"
		materials={wall.materials}
		placeholder="Add layer on the outside"
		onselect={(id) => wall.addLayer(id)}
	/>
</div>
