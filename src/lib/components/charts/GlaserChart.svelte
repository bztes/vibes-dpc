<script lang="ts">
	import ChartTooltip from '#lib/components/ui/ChartTooltip.svelte';
	import LegendItem from '#lib/components/ui/LegendItem.svelte';
	import SegmentedControl from '#lib/components/ui/SegmentedControl.svelte';
	import { categoryStyles } from '#lib/layer-style.ts';
	import { fmt, fmtSd } from '#lib/format.ts';
	import type { WallResult } from '#lib/physics/glaser.ts';
	import type { Layer } from '#lib/physics/types.ts';
	import LayerPatterns from './LayerPatterns.svelte';
	import { bandMarkers, layerBands, linear, mmToPx, pathFrom, ticks } from './geometry';

	interface Props {
		layers: Layer[];
		result: WallResult;
		/** Label of the layer at `index`, by default its position */
		number?: (index: number) => number;
	}

	let { layers, result, number = (index) => index + 1 }: Props = $props();

	const id = $props.id();
	const W = 720;
	const H = 380;
	const M = { top: 46, right: 16, bottom: 40, left: 56 };
	const plotTop = M.top;
	const plotBottom = H - M.bottom;

	let axis = $state<'thickness' | 'sd'>('sd');

	let activeLayers = $derived(layers.slice(0, result.activeCount));
	// In sd mode each layer is as wide as its sd value (in mm), otherwise as its thickness
	let bands = $derived(
		layerBands(
			axis === 'sd'
				? activeLayers.map((layer) => ({ ...layer, thickness: layer.mu * layer.thickness }))
				: activeLayers,
			M.left,
			W - M.left - M.right
		)
	);
	let nodePx = $derived(
		result.nodes.map((node) => mmToPx(bands, axis === 'sd' ? node.sd * 1000 : node.x))
	);
	let markers = $derived(bandMarkers(bands, M.top - 14));

	let y = $derived.by(() => {
		let max = result.pvIn;
		for (const node of result.nodes) max = Math.max(max, node.ps);
		return linear([0, Math.ceil((max * 1.08) / 250) * 250], [plotBottom, plotTop]);
	});
	let yTicks = $derived(ticks(0, y.invert(plotTop), 5));

	const line = (pick: (i: number) => number) =>
		pathFrom(result.nodes.map((_, i): [number, number] => [nodePx[i], y(pick(i))]));

	let psPath = $derived(line((i) => result.nodes[i].ps));
	let pvPath = $derived(line((i) => result.nodes[i].pv));
	let pvLinearPath = $derived(line((i) => result.nodes[i].pvLinear));
	let hasCondensation = $derived(result.condensation.length > 0);

	let condensationZones = $derived(
		result.condensation.map((zone) => {
			const nodes = result.nodes;
			const start = nodes.findIndex((node) => node.x >= zone.from - 1e-9);
			const end = nodes.findLastIndex((node) => node.x <= zone.to + 1e-9);
			const x0 = nodePx[start];
			const x1 = nodePx[end];
			const width = Math.max(8, x1 - x0);
			return {
				x: (x0 + x1) / 2 - width / 2,
				width,
				points: nodes.slice(start, end + 1).map((n, i) => [nodePx[start + i], y(n.ps)])
			};
		})
	);

	let hover = $state<number | null>(null);

	function onpointermove(event: PointerEvent & { currentTarget: SVGSVGElement }) {
		if (nodePx.length === 0) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * W;
		if (x < M.left - 4 || x > W - M.right + 4) {
			hover = null;
			return;
		}
		let best = 0;
		for (let i = 1; i < nodePx.length; i++) {
			if (Math.abs(nodePx[i] - x) < Math.abs(nodePx[best] - x)) best = i;
		}
		hover = best;
	}

	let hovered = $derived(hover === null ? null : result.nodes[hover]);
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
			<LegendItem label="Saturation pressure" color="var(--color-temp)" />
			<LegendItem label="Vapour pressure (Glaser)" color="var(--color-dew)" />
			{#if hasCondensation}
				<LegendItem label="without condensation" color="var(--color-dew)" kind="dashed" />
			{/if}
		</div>
		<SegmentedControl
			bind:value={axis}
			label="x axis"
			options={[
				{ value: 'sd', label: 'sd value' },
				{ value: 'thickness', label: 'Thickness' }
			]}
		/>
	</div>

	{#if result.activeCount === 0}
		<p class="py-12 text-center text-sm text-stone-500">No effective layers.</p>
	{:else}
		<div class="relative">
			<svg
				viewBox="0 0 {W} {H}"
				class="h-auto w-full touch-none select-none"
				role="img"
				aria-label="Glaser diagram: vapour pressure and saturation pressure across the construction"
				{onpointermove}
				onpointerleave={() => (hover = null)}
			>
				<LayerPatterns prefix={id} />

				{#each bands as band, i (band.layer.id)}
					{@const style = categoryStyles[band.layer.category]}
					<rect
						x={band.x}
						y={plotTop}
						width={band.width}
						height={plotBottom - plotTop}
						fill={style.pattern === 'none' ? style.fill : `url(#${id}-${band.layer.category})`}
						opacity="0.35"
					/>
					<line
						x1={band.x}
						x2={band.x}
						y1={plotTop}
						y2={plotBottom}
						stroke="#fff"
						stroke-width="1.5"
					/>
					<circle cx={markers[i].cx} cy={markers[i].cy} r="8.5" fill="#292524" />
					<text
						x={markers[i].cx}
						y={markers[i].cy + 3.5}
						text-anchor="middle"
						class="fill-white text-[10px] font-semibold"
					>
						{number(i)}
					</text>
				{/each}

				{#each yTicks as tick (tick)}
					<line
						x1={M.left}
						x2={W - M.right}
						y1={y(tick)}
						y2={y(tick)}
						stroke="#1c1917"
						stroke-opacity="0.12"
						stroke-width="0.75"
					/>
					<text
						x={M.left - 6}
						y={y(tick) + 3.5}
						text-anchor="end"
						class="fill-stone-500 text-[10px] tabular-nums"
					>
						{fmt(tick, 0)}
					</text>
				{/each}
				<line x1={M.left} x2={W - M.right} y1={plotBottom} y2={plotBottom} stroke="#a8a29e" />
				<text x={M.left - 6} y={plotTop - 30} text-anchor="end" class="fill-stone-500 text-[10px]"
					>Pa</text
				>
				<text x={M.left} y={plotBottom + 18} class="fill-stone-500 text-[10px]">inside</text>
				<text
					x={W - M.right}
					y={plotBottom + 18}
					text-anchor="end"
					class="fill-stone-500 text-[10px]">outside</text
				>
				<text
					x={(M.left + W - M.right) / 2}
					y={plotBottom + 18}
					text-anchor="middle"
					class="fill-stone-500 text-[10px]"
				>
					{axis === 'sd'
						? `total sd ${fmtSd(result.sdTotal)} m`
						: `thickness ${fmt(result.activeThickness, 0)} mm`}
				</text>

				{#each condensationZones as zone, i (i)}
					<rect
						x={zone.x}
						y={plotTop}
						width={zone.width}
						height={plotBottom - plotTop}
						fill="url(#{id}-condensation)"
					/>
				{/each}

				{#if hasCondensation}
					<path
						d={pvLinearPath}
						fill="none"
						stroke="var(--color-dew)"
						stroke-width="1.5"
						stroke-dasharray="5 4"
						opacity="0.7"
					/>
				{/if}
				<path
					d={psPath}
					fill="none"
					stroke="var(--color-temp)"
					stroke-width="2.5"
					stroke-linejoin="round"
				/>
				<path
					d={pvPath}
					fill="none"
					stroke="var(--color-dew)"
					stroke-width="2.5"
					stroke-linejoin="round"
				/>

				{#each condensationZones as zone, i (i)}
					{#each [zone.points[0], zone.points[zone.points.length - 1]] as [cx, cy], j (j)}
						<circle {cx} {cy} r="5" fill="var(--color-critical)" stroke="#fff" stroke-width="2" />
					{/each}
				{/each}

				{#if hovered && hover !== null}
					<line
						x1={nodePx[hover]}
						x2={nodePx[hover]}
						y1={plotTop}
						y2={plotBottom}
						stroke="#1c1917"
						stroke-width="1"
					/>
					<circle
						cx={nodePx[hover]}
						cy={y(hovered.ps)}
						r="4.5"
						fill="var(--color-temp)"
						stroke="#fff"
						stroke-width="2"
					/>
					<circle
						cx={nodePx[hover]}
						cy={y(hovered.pv)}
						r="4.5"
						fill="var(--color-dew)"
						stroke="#fff"
						stroke-width="2"
					/>
				{/if}
			</svg>

			{#if hovered && hover !== null}
				<ChartTooltip x={(nodePx[hover] / W) * 100} title={layers[hovered.layer]?.name}>
					<div class="flex justify-between gap-4">
						<span>sd from inside</span><span class="text-stone-900 tabular-nums"
							>{fmtSd(hovered.sd)} m</span
						>
					</div>
					<div class="flex justify-between gap-4">
						<span>Saturation p<sub>s</sub></span><span class="text-stone-900 tabular-nums"
							>{fmt(hovered.ps, 0)} Pa</span
						>
					</div>
					<div class="flex justify-between gap-4">
						<span>Vapour pressure p</span><span class="text-stone-900 tabular-nums"
							>{fmt(hovered.pv, 0)} Pa</span
						>
					</div>
					<div class="flex justify-between gap-4">
						<span>Rel. humidity</span>
						<span class="text-stone-900 tabular-nums"
							>{fmt(Math.min(100, (hovered.pv / hovered.ps) * 100), 0)} %</span
						>
					</div>
				</ChartTooltip>
			{/if}
		</div>
	{/if}
</div>
