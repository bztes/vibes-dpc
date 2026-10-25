<script lang="ts">
	import ChartTooltip from '#lib/components/ui/ChartTooltip.svelte';
	import LegendItem from '#lib/components/ui/LegendItem.svelte';
	import { categoryStyles } from '#lib/layer-style.ts';
	import { fmt } from '#lib/format.ts';
	import { dewPoint } from '#lib/physics/glaser.ts';
	import type { WallResult } from '#lib/physics/glaser.ts';
	import type { Climate, Layer } from '#lib/physics/types.ts';
	import LayerPatterns from './LayerPatterns.svelte';
	import { bandMarkers, layerBands, linear, mmToPx, pathFrom, ticks } from './geometry';

	interface Props {
		layers: Layer[];
		result: WallResult;
		climate: Climate;
		/** Label of the layer at `index`, by default its position */
		number?: (index: number) => number;
	}

	let { layers, result, climate, number = (index) => index + 1 }: Props = $props();

	const id = $props.id();
	const W = 960;
	const H = 440;
	const M = { top: 78, right: 16, bottom: 46, left: 48 };
	const ZONE = 72;
	const wallX0 = M.left + ZONE;
	const wallX1 = W - M.right - ZONE;
	const plotTop = M.top;
	const plotBottom = H - M.bottom;

	let bands = $derived(layerBands(layers, wallX0, wallX1 - wallX0));
	let nodePx = $derived(result.nodes.map((node) => mmToPx(bands, node.x)));
	/** Boundary between the effective construction and outdoor air (or ventilation gap) */
	let outerPx = $derived(bands[result.activeCount]?.x ?? wallX1);
	let dewOut = $derived(dewPoint(result.pvOut));

	let y = $derived.by(() => {
		const values = [climate.tIn, climate.tOut, result.dewPointIn, dewOut];
		for (const node of result.nodes) values.push(node.t, node.dewLinear);
		const finite = values.filter(Number.isFinite);
		const min = Math.floor((Math.min(...finite) - 2) / 5) * 5;
		const max = Math.ceil((Math.max(...finite) + 2) / 5) * 5;
		return linear([min, max], [plotBottom, plotTop]);
	});
	let yTicks = $derived(ticks(y.invert(plotBottom), y.invert(plotTop), 6));

	let temperaturePath = $derived(
		pathFrom([
			[M.left, y(climate.tIn)],
			[wallX0 - 26, y(climate.tIn)],
			...result.nodes.map((node, i): [number, number] => [nodePx[i], y(node.t)]),
			[Math.min(outerPx + 26, W - M.right), y(climate.tOut)],
			[W - M.right, y(climate.tOut)]
		])
	);

	let dewPath = $derived(
		pathFrom([
			[M.left, y(result.dewPointIn)],
			...result.nodes.map((node, i): [number, number] => [nodePx[i], y(node.dewLinear)]),
			[W - M.right, y(dewOut)]
		])
	);

	/** Areas where the (linear) dew point lies above the construction temperature */
	let riskAreas = $derived.by(() => {
		const areas: string[] = [];
		const nodes = result.nodes;
		let upper: [number, number][] = [];
		let lower: [number, number][] = [];
		const close = () => {
			if (upper.length > 1) areas.push(pathFrom([...upper, ...lower.reverse()]) + 'Z');
			upper = [];
			lower = [];
		};
		for (let i = 0; i < nodes.length; i++) {
			const diff = nodes[i].dewLinear - nodes[i].t;
			if (i > 0) {
				const prevDiff = nodes[i - 1].dewLinear - nodes[i - 1].t;
				if (prevDiff > 0 !== diff > 0) {
					const f = prevDiff / (prevDiff - diff);
					const px = nodePx[i - 1] + f * (nodePx[i] - nodePx[i - 1]);
					const t = nodes[i - 1].t + f * (nodes[i].t - nodes[i - 1].t);
					upper.push([px, y(t)]);
					lower.push([px, y(t)]);
					if (diff <= 0) close();
				}
			}
			if (diff > 0) {
				upper.push([nodePx[i], y(nodes[i].dewLinear)]);
				lower.push([nodePx[i], y(nodes[i].t)]);
			}
		}
		close();
		return areas;
	});

	let condensationZones = $derived(
		result.condensation.map((zone) => {
			const x0 = mmToPx(bands, zone.from);
			const x1 = mmToPx(bands, zone.to);
			const width = Math.max(8, x1 - x0);
			return { x: (x0 + x1) / 2 - width / 2, width };
		})
	);

	let markers = $derived(bandMarkers(bands, M.top - 16));

	let hover = $state<number | null>(null);

	function onpointermove(event: PointerEvent & { currentTarget: SVGSVGElement }) {
		const rect = event.currentTarget.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * W;
		if (x < wallX0 - 4 || x > outerPx + 4 || result.nodes.length === 0) {
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
	<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
		<LegendItem label="Temperature" color="var(--color-temp)" />
		<LegendItem label="Dew point (linear vapour pressure)" color="var(--color-dew)" />
		<LegendItem label="Dew point above temperature" color="var(--color-dew)" kind="area" />
		<LegendItem label="Condensation (Glaser)" color="var(--color-critical)" kind="hatch" />
		<LegendItem label="Indoor air dew point" color="#44403c" kind="dashed" />
	</div>

	<div class="relative">
		<svg
			viewBox="0 0 {W} {H}"
			class="h-auto w-full touch-none select-none"
			role="img"
			aria-label="Wall section with temperature and dew point profile. Inner surface {fmt(
				result.tSi
			)} °C, indoor dew point {fmt(result.dewPointIn)} °C."
			{onpointermove}
			onpointerleave={() => (hover = null)}
		>
			<LayerPatterns prefix={id} />

			<!-- Climate zones -->
			<rect x={M.left} y={plotTop} width={ZONE} height={plotBottom - plotTop} fill="#fdf1ea" />
			<rect x={wallX1} y={plotTop} width={ZONE} height={plotBottom - plotTop} fill="#eaf2fb" />
			<text
				x={M.left + ZONE / 2}
				y={M.top - 44}
				text-anchor="middle"
				class="fill-stone-800 text-[12px] font-semibold"
			>
				INSIDE
			</text>
			<text
				x={M.left + ZONE / 2}
				y={M.top - 28}
				text-anchor="middle"
				class="fill-stone-500 text-[11px]"
			>
				{fmt(climate.tIn)} °C · {fmt(climate.rhIn, 0)} %
			</text>
			<text
				x={wallX1 + ZONE / 2}
				y={M.top - 44}
				text-anchor="middle"
				class="fill-stone-800 text-[12px] font-semibold"
			>
				OUTSIDE
			</text>
			<text
				x={wallX1 + ZONE / 2}
				y={M.top - 28}
				text-anchor="middle"
				class="fill-stone-500 text-[11px]"
			>
				{fmt(climate.tOut)} °C · {fmt(climate.rhOut, 0)} %
			</text>

			<!-- Layers -->
			{#each bands as band, i (band.layer.id)}
				{@const style = categoryStyles[band.layer.category]}
				{@const inactive = i >= result.activeCount}
				<g opacity={inactive ? 0.4 : 1}>
					<rect
						x={band.x}
						y={plotTop}
						width={band.width}
						height={plotBottom - plotTop}
						fill={style.pattern === 'none' ? style.fill : `url(#${id}-${band.layer.category})`}
						stroke="#fff"
						stroke-width="1"
					/>
					{#if band.layer.ventilated}
						{#each [0.3, 0.55, 0.8] as f (f)}
							<path
								d="M{band.x + band.width / 2},{plotTop +
									(plotBottom - plotTop) * f}l0,-22m-4,6l4,-6l4,6"
								fill="none"
								stroke={style.ink}
								stroke-width="1.5"
							/>
						{/each}
					{/if}
					{#if band.width > 30}
						<text
							x={band.x + band.width / 2}
							y={plotBottom - 8}
							text-anchor="middle"
							class="fill-stone-700 text-[10px] tabular-nums"
						>
							{fmt(band.layer.thickness, band.layer.thickness % 1 ? 1 : 0)}
						</text>
					{/if}
				</g>
				<g>
					<circle
						cx={markers[i].cx}
						cy={markers[i].cy}
						r="9"
						fill={inactive ? '#d6d3d1' : '#292524'}
					/>
					<text
						x={markers[i].cx}
						y={markers[i].cy + 3.5}
						text-anchor="middle"
						class={['text-[10px] font-semibold', inactive ? 'fill-stone-600' : 'fill-white']}
					>
						{number(i)}
					</text>
					<line
						x1={markers[i].cx}
						x2={markers[i].cx}
						y1={markers[i].cy + 9}
						y2={plotTop}
						stroke="#a8a29e"
						stroke-width="0.75"
					/>
				</g>
			{/each}

			{#if result.ventilated}
				<line x1={outerPx} x2={wallX1} y1={plotBottom + 14} y2={plotBottom + 14} stroke="#a8a29e" />
				<text
					x={(outerPx + wallX1) / 2}
					y={plotBottom + 30}
					text-anchor="middle"
					class="fill-stone-500 text-[10px]"
				>
					ventilated – not effective
				</text>
			{/if}

			<!-- Axis -->
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
			<text x={M.left - 6} y={plotTop - 8} text-anchor="end" class="fill-stone-500 text-[10px]"
				>°C</text
			>
			{#if y.invert(plotBottom) < 0 && y.invert(plotTop) > 0}
				<line
					x1={M.left}
					x2={W - M.right}
					y1={y(0)}
					y2={y(0)}
					stroke="#57534e"
					stroke-opacity="0.5"
					stroke-width="1"
				/>
			{/if}
			<text
				x={M.left + ZONE / 2}
				y={plotBottom + 30}
				text-anchor="middle"
				class="fill-stone-500 text-[10px]"
			>
				warm
			</text>
			<text
				x={wallX1 + ZONE / 2}
				y={plotBottom + 30}
				text-anchor="middle"
				class="fill-stone-500 text-[10px]"
			>
				cold
			</text>

			<!-- Risk and condensation areas -->
			{#each riskAreas as area, i (i)}
				<path d={area} fill="var(--color-dew)" fill-opacity="0.28" />
			{/each}
			{#each condensationZones as zone, i (i)}
				<rect
					x={zone.x}
					y={plotTop}
					width={zone.width}
					height={plotBottom - plotTop}
					fill="url(#{id}-condensation)"
				/>
				<text
					x={zone.x + zone.width / 2}
					y={plotTop + 14}
					text-anchor="middle"
					class="fill-critical-ink text-[11px] font-semibold"
				>
					Condensation
				</text>
			{/each}

			<!-- Curves -->
			<path
				d={dewPath}
				fill="none"
				stroke="var(--color-dew)"
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<path
				d={temperaturePath}
				fill="none"
				stroke="var(--color-temp)"
				stroke-width="2.5"
				stroke-linejoin="round"
			/>

			{#if result.dewPlane}
				{@const px = mmToPx(bands, result.dewPlane.x)}
				<line
					x1={px}
					x2={px}
					y1={plotTop}
					y2={plotBottom}
					stroke="#44403c"
					stroke-width="1.25"
					stroke-dasharray="4 3"
				/>
				<circle
					cx={px}
					cy={y(result.dewPointIn)}
					r="4"
					fill="#44403c"
					stroke="#fff"
					stroke-width="2"
				/>
				<text
					x={px + (px > W - 200 ? -6 : 6)}
					y={y(result.dewPointIn) - 8}
					text-anchor={px > W - 200 ? 'end' : 'start'}
					class="fill-stone-800 text-[11px] font-medium"
					paint-order="stroke"
					stroke="#fff"
					stroke-width="3"
				>
					Dew point {fmt(result.dewPointIn)} °C
				</text>
			{/if}

			<!-- Hover -->
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
					cy={y(hovered.t)}
					r="4.5"
					fill="var(--color-temp)"
					stroke="#fff"
					stroke-width="2"
				/>
				{#if Number.isFinite(hovered.dewLinear)}
					<circle
						cx={nodePx[hover]}
						cy={y(hovered.dewLinear)}
						r="4.5"
						fill="var(--color-dew)"
						stroke="#fff"
						stroke-width="2"
					/>
				{/if}
			{/if}
		</svg>

		{#if hovered && hover !== null}
			{@const layer = layers[hovered.layer]}
			<ChartTooltip x={(nodePx[hover] / W) * 100} title={layer?.name}>
				<div class="flex justify-between gap-4">
					<span>Position</span><span class="text-stone-900 tabular-nums"
						>{fmt(hovered.x, 1)} mm</span
					>
				</div>
				<div class="flex justify-between gap-4">
					<span>Temperature</span><span class="text-stone-900 tabular-nums"
						>{fmt(hovered.t)} °C</span
					>
				</div>
				<div class="flex justify-between gap-4">
					<span>Dew point</span><span class="text-stone-900 tabular-nums"
						>{fmt(hovered.dewLinear)} °C</span
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
</div>
