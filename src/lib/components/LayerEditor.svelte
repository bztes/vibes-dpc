<script lang="ts">
	import Badge from '#lib/components/ui/Badge.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import MaterialPicker from '#lib/components/MaterialPicker.svelte';
	import NumberField from '#lib/components/ui/NumberField.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { categoryStyles, inkOn } from '#lib/layer-style.ts';
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

<!-- Small plus on the border between two layers; inserts before `index` -->
{#snippet inserter(index: number, edge: 'top' | 'bottom')}
	{#if dragIndex === undefined}
		<div
			class={[
				'group/gap absolute inset-x-0 z-10 flex h-5 items-center has-aria-expanded:z-40',
				edge === 'top' ? '-top-2.5' : '-bottom-2.5'
			]}
		>
			<span
				class="pointer-events-none absolute inset-x-3 top-1/2 h-px bg-accent opacity-0 transition group-focus-within/gap:opacity-100 group-hover/gap:opacity-100"
			></span>
			<div class="relative flex-1">
				<MaterialPicker
					label="Add layer"
					variant="insert"
					materials={wall.materials}
					placeholder={index === 0
						? 'Add layer on the inside'
						: index === wall.layers.length
							? 'Add layer on the outside'
							: `Add layer between ${index} and ${index + 1}`}
					onselect={(id) => wall.addLayer(id, index)}
				/>
			</div>
		</div>
	{/if}
{/snippet}

<div class="flex flex-col py-8">
	<ol class="flex flex-col border-y border-line">
		{#each wall.layers as layer, i (layer.id)}
			{@const style = categoryStyles[layer.category]}
			{@const activeIndex = wall.activeLayers.indexOf(layer)}
			{@const inactive = activeIndex < 0 || activeIndex >= wall.result.activeCount}
			{@const open = !!expanded[layer.id]}
			{@const materialName = wall.materials.find((m) => m.id === layer.material)?.name}
			<li
				ondragover={(event) => dragOver(event, i)}
				ondrop={(event) => {
					event.preventDefault();
					drop();
				}}
				class={[
					'group relative border-b border-line transition-colors last:border-b-0',
					open ? 'bg-surface-2' : 'hover:bg-surface-2/70',
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
						aria-expanded={open}
						aria-label="Layer {i + 1}: {layer.name} – {open ? 'collapse' : 'edit'}"
						onclick={() => (expanded[layer.id] = !open)}
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

				{#if open}
					<div class="flex flex-col gap-3 px-3 pt-1 pb-3 lg:px-4">
						<MaterialPicker
							label="Material"
							materials={wall.materials}
							value={layer.material}
							placeholder="Custom material"
							onselect={(id) => wall.replaceMaterial(i, id)}
						/>
						<TextField label="Name" bind:value={layer.name} />
						<div class="grid grid-cols-2 gap-2">
							<NumberField
								label="λ conductivity"
								unit="W/mK"
								min={0.001}
								bind:value={() => layer.lambda, (v) => customize(i, 'lambda', v)}
							/>
							<NumberField
								label="μ diffusion resist."
								min={0}
								bind:value={() => layer.mu, (v) => customize(i, 'mu', v)}
							/>
						</div>
						<p class="text-[11px] text-fg-subtle tabular-nums">
							sd = {fmtSd((layer.mu * layer.thickness) / 1000)} m · R = {fmt(
								layer.thickness / 1000 / layer.lambda,
								3
							)} m²K/W
							{#if layer.ventilated}· this and all outer layers are ignored{/if}
						</p>
						<div class="flex flex-wrap items-center gap-1">
							<Button
								size="sm"
								variant="ghost"
								icon="up"
								label="Move layer up"
								disabled={i === 0}
								onclick={() => wall.moveLayer(i, -1)}
							/>
							<Button
								size="sm"
								variant="ghost"
								icon="down"
								label="Move layer down"
								disabled={i === wall.layers.length - 1}
								onclick={() => wall.moveLayer(i, 1)}
							/>
							<Button size="sm" variant="ghost" icon="copy" onclick={() => wall.duplicateLayer(i)}
								>Duplicate</Button
							>
							<Button
								size="sm"
								variant="danger"
								icon="trash"
								class="ml-auto"
								onclick={() => wall.removeLayer(i)}>Remove</Button
							>
						</div>
					</div>
				{/if}
			</li>
		{:else}
			<li class="flex flex-col items-center gap-3 px-4 py-8 text-center text-sm text-fg-muted">
				<Icon name="layers" size={20} class="text-fg-subtle" />
				No layers yet – add the innermost material first.
				<div class="w-full">
					<MaterialPicker
						label="Add layer"
						variant="add"
						materials={wall.materials}
						placeholder="Add first layer"
						onselect={(id) => wall.addLayer(id)}
					/>
				</div>
			</li>
		{/each}
	</ol>
</div>
