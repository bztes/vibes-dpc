<!-- Layers to scale, inside on the left -->
<script lang="ts">
	import { categoryStyles } from '#lib/layer-style.ts';
	import type { AssemblyLayer } from '#lib/physics/types.ts';

	interface Props {
		layers: AssemblyLayer[];
		class?: string;
	}

	let { layers, class: className }: Props = $props();

	let total = $derived(layers.reduce((sum, layer) => sum + layer.thickness, 0));
</script>

<div class={['flex h-3 overflow-hidden rounded-full bg-stone-100', className]} aria-hidden="true">
	{#each layers as layer, i (i)}
		<span
			style:background={categoryStyles[layer.category].fill}
			style:width="{(layer.thickness / total) * 100}%"
			style:min-width="2px"
			style:opacity={layer.disabled ? 0.35 : undefined}
		></span>
	{/each}
</div>
