<script lang="ts">
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import Stat from '#lib/components/ui/Stat.svelte';
	import { fmt, fmtSd } from '#lib/format.ts';
	import type { CriticalTemperature } from '#lib/physics/glaser.ts';
	import { verdictStyles } from '#lib/verdict.ts';
	import { getWall } from '#lib/wall.svelte.ts';

	const wall = getWall();

	let result = $derived(wall.result);
	let verdict = $derived(wall.verdict);
	let styles = $derived(verdictStyles[verdict.tone]);

	function describe(critical: CriticalTemperature) {
		if (critical.kind === 'none') return 'not down to −30 °C';
		if (critical.kind === 'always') return `already below ${fmt(wall.climate.tIn)} °C`;
		return `below ${fmt(critical.t)} °C`;
	}

	const limit = (value: number) => (value >= 100 ? '100' : fmt(value, 0));
</script>

{#snippet risk(
	icon: IconName,
	tint: string,
	title: string,
	critical: CriticalTemperature,
	rhLimit: number
)}
	<li class="flex gap-3 py-2.5">
		<span class={['mt-0.5 grid size-6 shrink-0 place-items-center rounded-md', tint]}>
			<Icon name={icon} size={13} />
		</span>
		<div class="min-w-0 text-xs/relaxed text-fg-muted">
			<div class="text-[13px] font-medium text-fg">{title}</div>
			<div>
				Outdoors <strong class="font-semibold text-fg">{describe(critical)}</strong>
				<span class="text-fg-subtle">at {fmt(wall.climate.rhIn, 0)} % inside</span>
			</div>
			<div>
				Indoors above <strong class="font-semibold text-fg">{limit(rhLimit)} %</strong>
				<span class="text-fg-subtle">at {fmt(wall.climate.tOut)} °C outside</span>
			</div>
		</div>
	</li>
{/snippet}

<div class="flex flex-col">
	<div role="status" class={['border-b border-line p-4', styles.tint]}>
		<div class="flex items-center gap-3">
			<span class={['grid size-8 shrink-0 place-items-center rounded-lg', styles.solid]}>
				<Icon name={verdict.icon} size={17} strokeWidth={2.25} />
			</span>
			<h3 class={['text-base leading-tight font-semibold tracking-tight', styles.ink]}>
				{verdict.title}
			</h3>
		</div>
		<!-- Reserve room for the longest verdict so the climate sliders below don't jump while editing -->
		<p class="mt-3 min-h-[6lh] text-[13px]/relaxed text-pretty text-fg-muted tabular-nums">
			{verdict.text}
		</p>
	</div>

	<div
		class="grid grid-cols-2 border-b border-line *:border-line *:odd:border-r *:nth-[-n+2]:border-b"
	>
		<Stat label="U-value" value={fmt(result.uValue, 2)} unit="W/m²K" hint="EN ISO 6946" />
		<Stat
			label="Indoor dew point"
			value={fmt(result.dewPointIn)}
			unit="°C"
			hint="{fmt(wall.climate.tIn)} °C · {fmt(wall.climate.rhIn, 0)} %"
		/>
		<Stat
			label="Inner surface"
			value={fmt(result.tSi)}
			unit="°C"
			hint="{fmt(Math.min(100, result.surfaceRH), 0)} % RH at surface"
		/>
		<Stat label="sd value" value={fmtSd(result.sdTotal)} unit="m" hint="effective layers" />
	</div>

	<div class="border-b border-line px-4 pt-3 pb-1">
		<h3 class="text-[11px] font-medium tracking-wide text-fg-subtle uppercase">Critical when</h3>
		<ul class="divide-y divide-line">
			{@render risk(
				'drop',
				'bg-critical/12 text-critical-ink',
				'Interstitial condensation',
				wall.criticalCondensation,
				wall.currentLimits.condensation
			)}
			{@render risk(
				'alert',
				'bg-warning/15 text-warning-ink',
				'Surface mould risk',
				wall.criticalMould,
				wall.currentLimits.mould
			)}
		</ul>
	</div>
</div>
