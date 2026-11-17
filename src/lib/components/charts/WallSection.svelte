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
	// Drawn at the rendered pixel size so labels stay legible on small screens
	let width = $state(960);
	let height = $state(0);
	let W = $derived(Math.max(280, Math.round(width)));
	// Fills the available height; without one it keeps a pleasant aspect ratio
	let H = $derived(
		Math.round(height > 0 ? Math.max(200, height) : Math.min(440, Math.max(320, W * 0.46)))
	);
	let narrow = $derived(W < 560);
	const M = { top: 78, right: 12, bottom: 46, left: 40 };
	let ZONE = $derived(narrow ? 52 : 72);
	let wallX0 = $derived(M.left + ZONE);
	let wallX1 = $derived(W - M.right - ZONE);
	const plotTop = M.top;
	let plotBottom = $derived(H - M.bottom);

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

<div class="flex h-full min-h-0 flex-col gap-3">
	<div
		class="flex [scrollbar-width:none] items-center gap-x-4 gap-y-1 whitespace-nowrap max-sm:overflow-x-auto sm:flex-wrap"
	>
		<LegendItem label="Temperature" color="var(--color-temp)" />
		<LegendItem label="Dew point (linear vapour pressure)" color="var(--color-dew)" />
		<LegendItem label="Dew point above temperature" color="var(--color-dew)" kind="area" />
		<LegendItem label="Condensation (Glaser)" color="var(--color-critical)" kind="hatch" />
		<LegendItem label="Indoor air dew point" color="var(--chart-ink)" kind="dashed" />
	</div>

	<div class="relative min-h-[200px] flex-1" bind:clientWidth={width} bind:clientHeight={height}>
		<svg
			viewBox="0 0 {W} {H}"
			class="absolute inset-0 size-full touch-pan-y select-none"
			role="img"
			aria-label="Wall section with temperature and dew point profile. Inner surface {fmt(
				result.tSi
			)} °C, indoor dew point {fmt(result.dewPointIn)} °C."
			{onpointermove}
			onpointerleave={() => (hover = null)}
		>
			<LayerPatterns prefix={id} />

			<!-- Climate zones -->
			<rect
				x={M.left}
				y={plotTop}
				width={ZONE}
				height={plotBottom - plotTop}
				fill="var(--zone-warm)"
			/>
			<rect
				x={wallX1}
				y={plotTop}
				width={ZONE}
				height={plotBottom - plotTop}
				fill="var(--zone-cold)"
			/>
			<text
				x={M.left + ZONE / 2}
				y={M.top - (narrow ? 52 : 44)}
				text-anchor="middle"
				class="fill-chart-ink text-[12px] font-semibold"
			>
				INSIDE
			</text>
			<text
				x={M.left + ZONE / 2}
				y={M.top - (narrow ? 36 : 28)}
				text-anchor="middle"
				class="fill-chart-muted text-[11px]"
			>
				{#if narrow}
					<tspan>{fmt(climate.tIn)} °C</tspan>
					<tspan x={M.left + ZONE / 2} dy="13">{fmt(climate.rhIn, 0)} %</tspan>
				{:else}
					{fmt(climate.tIn)} °C · {fmt(climate.rhIn, 0)} %
				{/if}
			</text>
			<text
				x={wallX1 + ZONE / 2}
				y={M.top - (narrow ? 52 : 44)}
				text-anchor="middle"
				class="fill-chart-ink text-[12px] font-semibold"
			>
				OUTSIDE
			</text>
			<text
				x={wallX1 + ZONE / 2}
				y={M.top - (narrow ? 36 : 28)}
				text-anchor="middle"
				class="fill-chart-muted text-[11px]"
			>
				{#if narrow}
					<tspan>{fmt(climate.tOut)} °C</tspan>
					<tspan x={wallX1 + ZONE / 2} dy="13">{fmt(climate.rhOut, 0)} %</tspan>
				{:else}
					{fmt(climate.tOut)} °C · {fmt(climate.rhOut, 0)} %
				{/if}
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
						stroke="var(--surface)"
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
							class="fill-chart-ink text-[10px] tabular-nums"
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
						fill={inactive ? 'var(--surface-3)' : 'var(--chart-ink)'}
					/>
					<text
						x={markers[i].cx}
						y={markers[i].cy + 3.5}
						text-anchor="middle"
						class={['text-[10px] font-semibold', inactive ? 'fill-fg-muted' : 'fill-surface']}
					>
						{number(i)}
					</text>
					<line
						x1={markers[i].cx}
						x2={markers[i].cx}
						y1={markers[i].cy + 9}
						y2={plotTop}
						stroke="var(--chart-muted)"
						stroke-width="0.75"
					/>
				</g>
			{/each}

			{#if result.ventilated}
				<line
					x1={outerPx}
					x2={wallX1}
					y1={plotBottom + 14}
					y2={plotBottom + 14}
					stroke="var(--chart-muted)"
				/>
				<text
					x={(outerPx + wallX1) / 2}
					y={plotBottom + 30}
					text-anchor="middle"
					class="fill-chart-muted text-[10px]"
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
					stroke="var(--chart-ink)"
					stroke-opacity="0.12"
					stroke-width="0.75"
				/>
				<text
					x={M.left - 6}
					y={y(tick) + 3.5}
					text-anchor="end"
					class="fill-chart-muted text-[10px] tabular-nums"
				>
					{fmt(tick, 0)}
				</text>
			{/each}
			<text x={M.left - 6} y={plotTop - 8} text-anchor="end" class="fill-chart-muted text-[10px]"
				>°C</text
			>
			{#if y.invert(plotBottom) < 0 && y.invert(plotTop) > 0}
				<line
					x1={M.left}
					x2={W - M.right}
					y1={y(0)}
					y2={y(0)}
					stroke="var(--chart-ink)"
					stroke-opacity="0.5"
					stroke-width="1"
				/>
			{/if}
			{#if !narrow}
				<text
					x={M.left + ZONE / 2}
					y={plotBottom + 30}
					text-anchor="middle"
					class="fill-chart-muted text-[10px]"
				>
					warm
				</text>
			{/if}
			{#if !narrow}
				<text
					x={wallX1 + ZONE / 2}
					y={plotBottom + 30}
					text-anchor="middle"
					class="fill-chart-muted text-[10px]"
				>
					cold
				</text>
			{/if}

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
					stroke="var(--chart-ink)"
					stroke-width="1.25"
					stroke-dasharray="4 3"
				/>
				<circle
					cx={px}
					cy={y(result.dewPointIn)}
					r="4"
					fill="var(--chart-ink)"
					stroke="var(--surface)"
					stroke-width="2"
				/>
				<text
					x={px + (px > W - 200 ? -6 : 6)}
					y={y(result.dewPointIn) - 8}
					text-anchor={px > W - 200 ? 'end' : 'start'}
					class="fill-chart-ink text-[11px] font-medium"
					paint-order="stroke"
					stroke="var(--surface)"
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
					stroke="var(--chart-ink)"
					stroke-width="1"
				/>
				<circle
					cx={nodePx[hover]}
					cy={y(hovered.t)}
					r="4.5"
					fill="var(--color-temp)"
					stroke="var(--surface)"
					stroke-width="2"
				/>
				{#if Number.isFinite(hovered.dewLinear)}
					<circle
						cx={nodePx[hover]}
						cy={y(hovered.dewLinear)}
						r="4.5"
						fill="var(--color-dew)"
						stroke="var(--surface)"
						stroke-width="2"
					/>
				{/if}
			{/if}
		</svg>

		{#if hovered && hover !== null}
			{@const layer = layers[hovered.layer]}
			<ChartTooltip x={(nodePx[hover] / W) * 100} title={layer?.name}>
				<div class="flex justify-between gap-4">
					<span>Position</span><span class="text-fg tabular-nums">{fmt(hovered.x, 1)} mm</span>
				</div>
				<div class="flex justify-between gap-4">
					<span>Temperature</span><span class="text-fg tabular-nums">{fmt(hovered.t)} °C</span>
				</div>
				<div class="flex justify-between gap-4">
					<span>Dew point</span><span class="text-fg tabular-nums">{fmt(hovered.dewLinear)} °C</span
					>
				</div>
				<div class="flex justify-between gap-4">
					<span>Rel. humidity</span>
					<span class="text-fg tabular-nums"
						>{fmt(Math.min(100, (hovered.pv / hovered.ps) * 100), 0)} %</span
					>
				</div>
			</ChartTooltip>
		{/if}
	</div>
</div>
