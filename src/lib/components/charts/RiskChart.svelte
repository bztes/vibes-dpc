<script lang="ts">
	import ChartTooltip from '#lib/components/ui/ChartTooltip.svelte';
	import LegendItem from '#lib/components/ui/LegendItem.svelte';
	import { fmt } from '#lib/format.ts';
	import type { RhLimits } from '#lib/physics/glaser.ts';
	import type { Climate } from '#lib/physics/types.ts';
	import { linear, pathFrom, ticks } from './geometry';

	interface Props {
		curve: RhLimits[];
		climate: Climate;
	}

	let { curve, climate }: Props = $props();

	// Drawn at the rendered pixel size so labels stay legible on small screens
	let width = $state(720);
	let height = $state(0);
	let W = $derived(Math.max(280, Math.round(width)));
	// Fills the available height; without one it keeps a pleasant aspect ratio
	let H = $derived(
		Math.round(height > 0 ? Math.max(200, height) : Math.min(400, Math.max(280, W * 0.53)))
	);
	let narrow = $derived(W < 560);
	const M = { top: 20, right: 20, bottom: 44, left: 48 };

	let x = $derived(
		linear([curve[0]?.tOut ?? -20, curve[curve.length - 1]?.tOut ?? 20], [M.left, W - M.right])
	);
	let y = $derived(linear([0, 100], [H - M.bottom, M.top]));
	const cap = (v: number) => Math.min(100, v);

	let condensationLine = $derived(
		curve.map((p): [number, number] => [x(p.tOut), y(cap(p.condensation))])
	);
	let mouldLine = $derived(curve.map((p): [number, number] => [x(p.tOut), y(cap(p.mould))]));

	let areas = $derived.by(() => {
		const top = curve.map((p): [number, number] => [x(p.tOut), y(100)]);
		const bottom = curve.map((p): [number, number] => [x(p.tOut), y(0)]);
		const minLine = curve.map((p): [number, number] => [
			x(p.tOut),
			y(cap(Math.min(p.mould, p.condensation)))
		]);
		const maxLine = curve.map((p): [number, number] => [
			x(p.tOut),
			y(cap(Math.max(p.mould, p.condensation)))
		]);
		const area = (upper: [number, number][], lower: [number, number][]) =>
			pathFrom([...upper, ...lower.toReversed()]) + 'Z';
		return {
			ok: area(minLine, bottom),
			// Mould risk without condensation: between the mould and condensation limits
			mould: area(maxLine, mouldLine),
			condensation: area(top, condensationLine)
		};
	});

	let current = $derived.by(() => {
		const t = Math.max(
			curve[0]?.tOut ?? -20,
			Math.min(curve[curve.length - 1]?.tOut ?? 20, climate.tOut)
		);
		const limits = interpolate(t);
		const status =
			climate.rhIn > limits.condensation
				? 'critical'
				: climate.rhIn > limits.mould
					? 'warning'
					: 'good';
		return { t, limits, status };
	});

	function interpolate(t: number): RhLimits {
		for (let i = 1; i < curve.length; i++) {
			if (t <= curve[i].tOut) {
				const a = curve[i - 1];
				const b = curve[i];
				const f = (t - a.tOut) / (b.tOut - a.tOut);
				return {
					tOut: t,
					condensation: a.condensation + f * (b.condensation - a.condensation),
					mould: a.mould + f * (b.mould - a.mould)
				};
			}
		}
		return curve[curve.length - 1];
	}

	const statusColor = {
		good: 'var(--color-good)',
		warning: 'var(--color-warning)',
		critical: 'var(--color-critical)'
	};

	let hover = $state<RhLimits | null>(null);

	function onpointermove(event: PointerEvent & { currentTarget: SVGSVGElement }) {
		if (curve.length === 0) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const px = ((event.clientX - rect.left) / rect.width) * W;
		const t = Math.round(x.invert(px));
		hover = curve.find((p) => p.tOut === t) ?? null;
	}
</script>

<div class="flex h-full min-h-0 flex-col gap-3">
	<div
		class="flex [scrollbar-width:none] items-center gap-x-4 gap-y-1 whitespace-nowrap max-sm:overflow-x-auto sm:flex-wrap"
	>
		<LegendItem label="safe" color="var(--color-good)" kind="area" />
		<LegendItem label="Mould risk (surface > 80 %)" color="var(--color-warning)" kind="area" />
		<LegendItem label="Interstitial condensation" color="var(--color-critical)" kind="area" />
		<LegendItem label="current conditions" color="var(--chart-ink)" kind="dot" />
	</div>

	<div class="relative min-h-[200px] flex-1" bind:clientWidth={width} bind:clientHeight={height}>
		<svg
			viewBox="0 0 {W} {H}"
			class="absolute inset-0 size-full touch-pan-y select-none"
			role="img"
			aria-label="Indoor humidity limits as a function of outdoor temperature"
			{onpointermove}
			onpointerleave={() => (hover = null)}
		>
			<path d={areas.ok} fill="var(--color-good)" fill-opacity="0.14" />
			<path d={areas.mould} fill="var(--color-warning)" fill-opacity="0.3" />
			<path d={areas.condensation} fill="var(--color-critical)" fill-opacity="0.2" />

			{#each ticks(0, 100, 5) as tick (tick)}
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
					class="fill-chart-muted text-[10px] tabular-nums">{tick}</text
				>
			{/each}
			{#each ticks(x.invert(M.left), x.invert(W - M.right), 8) as tick (tick)}
				<line
					x1={x(tick)}
					x2={x(tick)}
					y1={M.top}
					y2={H - M.bottom}
					stroke="var(--chart-ink)"
					stroke-opacity={tick === 0 ? 0.3 : 0.07}
					stroke-width="0.75"
				/>
				<text
					x={x(tick)}
					y={H - M.bottom + 16}
					text-anchor="middle"
					class="fill-chart-muted text-[10px] tabular-nums">{tick}</text
				>
			{/each}
			<text x={4} y={M.top - 8} class="fill-chart-muted text-[10px]">% RH inside</text>
			<text
				x={(M.left + W - M.right) / 2}
				y={H - 8}
				text-anchor="middle"
				class="fill-chart-muted text-[10px]"
			>
				Outdoor temperature in °C{narrow
					? ''
					: ` (inside ${fmt(climate.tIn)} °C, outside ${fmt(climate.rhOut, 0)} % RH)`}
			</text>

			<path
				d={pathFrom(mouldLine)}
				fill="none"
				stroke="var(--color-warning-ink)"
				stroke-width="2"
				stroke-dasharray="6 4"
			/>
			<path
				d={pathFrom(condensationLine)}
				fill="none"
				stroke="var(--color-critical)"
				stroke-width="2"
			/>

			<!-- Current conditions -->
			<line
				x1={x(current.t)}
				x2={x(current.t)}
				y1={y(climate.rhIn)}
				y2={H - M.bottom}
				stroke="var(--chart-ink)"
				stroke-width="1"
				stroke-dasharray="2 3"
			/>
			<line
				x1={M.left}
				x2={x(current.t)}
				y1={y(climate.rhIn)}
				y2={y(climate.rhIn)}
				stroke="var(--chart-ink)"
				stroke-width="1"
				stroke-dasharray="2 3"
			/>
			<circle
				cx={x(current.t)}
				cy={y(climate.rhIn)}
				r="7"
				fill={statusColor[current.status as keyof typeof statusColor]}
				stroke="var(--chart-ink)"
				stroke-width="2"
			/>

			{#if hover}
				<line
					x1={x(hover.tOut)}
					x2={x(hover.tOut)}
					y1={M.top}
					y2={H - M.bottom}
					stroke="var(--chart-ink)"
					stroke-width="1"
				/>
				<circle
					cx={x(hover.tOut)}
					cy={y(cap(hover.condensation))}
					r="4.5"
					fill="var(--color-critical)"
					stroke="var(--surface)"
					stroke-width="2"
				/>
				<circle
					cx={x(hover.tOut)}
					cy={y(cap(hover.mould))}
					r="4.5"
					fill="var(--color-warning)"
					stroke="var(--surface)"
					stroke-width="2"
				/>
			{/if}
		</svg>

		{#if hover}
			<ChartTooltip x={(x(hover.tOut) / W) * 100} title="Outside {fmt(hover.tOut, 0)} °C">
				<div class="flex justify-between gap-4">
					<span>Condensation above</span>
					<span class="text-fg tabular-nums"
						>{hover.condensation >= 100 ? '–' : `${fmt(hover.condensation, 0)} %`}</span
					>
				</div>
				<div class="flex justify-between gap-4">
					<span>Mould risk above</span>
					<span class="text-fg tabular-nums"
						>{hover.mould >= 100 ? '–' : `${fmt(hover.mould, 0)} %`}</span
					>
				</div>
				<div class="mt-1 text-[11px] text-fg-subtle">Indoor humidity at {fmt(climate.tIn)} °C</div>
			</ChartTooltip>
		{/if}
	</div>
</div>
