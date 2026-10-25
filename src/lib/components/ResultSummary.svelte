<script lang="ts">
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import Stat from '#lib/components/ui/Stat.svelte';
	import { fmt, fmtSd } from '#lib/format.ts';
	import {
		COLD_PERIOD_DAYS,
		CONDENSATE_LIMIT,
		MOULD_RH,
		type CriticalTemperature
	} from '#lib/physics/glaser.ts';
	import { getWall } from '#lib/wall.svelte.ts';

	const wall = getWall();

	let result = $derived(wall.result);
	const layerName = (index: number) =>
		`${wall.layerNumber(index)} “${wall.activeLayers[index]?.name ?? ''}”`;

	let verdict = $derived.by(
		(): { tone: 'good' | 'warning' | 'critical'; icon: IconName; title: string; text: string } => {
			if (result.condensation.length > 0) {
				const layers = [...new Set(result.condensation.flatMap((zone) => zone.layers))];
				const mass = (result.condensationRate * 24 * COLD_PERIOD_DAYS) / 1000;
				const minor = mass <= CONDENSATE_LIMIT;
				return {
					tone: minor ? 'warning' : 'critical',
					icon: minor ? 'alert' : 'drop',
					title: minor ? 'Minor interstitial condensation' : 'Interstitial condensation',
					text: `Water vapour condenses in layer ${layers.map(layerName).join(', ')}. Rate approx. ${fmt(result.condensationRate, 2)} g/(m²·h) – over a ${COLD_PERIOD_DAYS}-day cold period ≈ ${fmt(mass, 2)} kg/m²${minor ? ` (below the ${fmt(CONDENSATE_LIMIT, 1)} kg/m² limit of DIN 4108-3, provided it dries out in summer).` : '.'}`
				};
			}
			if (result.surfaceRH >= 100) {
				return {
					tone: 'critical',
					icon: 'drop',
					title: 'Surface condensation',
					text: `The inner surface (${fmt(result.tSi)} °C) is colder than the indoor dew point (${fmt(result.dewPointIn)} °C).`
				};
			}
			if (result.surfaceRH > MOULD_RH) {
				return {
					tone: 'warning',
					icon: 'alert',
					title: 'Mould risk on the inner surface',
					text: `Relative humidity at the surface is ${fmt(result.surfaceRH, 0)} % (limit ${MOULD_RH} %). There is no condensation inside the wall.`
				};
			}
			return {
				tone: 'good',
				icon: 'check',
				title: 'No condensation',
				text: result.dewPlane
					? `The indoor dew point (${fmt(result.dewPointIn)} °C) is reached in layer ${layerName(result.dewPlane.layer)} – but so little vapour gets there that the vapour pressure stays below saturation.`
					: `The entire build-up stays warmer than the indoor dew point (${fmt(result.dewPointIn)} °C).`
			};
		}
	);

	function describe(critical: CriticalTemperature) {
		if (critical.kind === 'none') return 'not down to −30 °C';
		if (critical.kind === 'always') return `already below ${fmt(wall.climate.tIn)} °C`;
		return `below ${fmt(critical.t)} °C`;
	}

	const limit = (value: number) => (value >= 100 ? '100' : fmt(value, 0));
</script>

{#snippet risk(
	icon: IconName,
	iconClass: string,
	title: string,
	critical: CriticalTemperature,
	rhLimit: number
)}
	<div class="flex gap-3 rounded-xl border border-stone-200 p-3">
		<span class={['mt-0.5', iconClass]}><Icon name={icon} /></span>
		<div class="text-sm">
			<div class="font-medium text-stone-800">{title}</div>
			<div class="text-stone-600">
				at {fmt(wall.climate.rhIn, 0)} % indoors: outdoor temperature
				<strong>{describe(critical)}</strong>
			</div>
			<div class="text-stone-600">
				at {fmt(wall.climate.tOut)} °C outdoors: indoor humidity above
				<strong>{limit(rhLimit)} %</strong>
			</div>
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-4">
	<div
		class={[
			'flex gap-3 rounded-xl p-4 ring-1',
			verdict.tone === 'good' && 'bg-green-50 ring-good/30',
			verdict.tone === 'warning' && 'bg-amber-50 ring-warning/50',
			verdict.tone === 'critical' && 'bg-red-50 ring-critical/30'
		]}
		role="status"
	>
		<span
			class={[
				'grid size-9 shrink-0 place-items-center rounded-full',
				verdict.tone === 'good' && 'bg-good text-white',
				verdict.tone === 'warning' && 'bg-warning text-stone-900',
				verdict.tone === 'critical' && 'bg-critical text-white'
			]}
		>
			<Icon name={verdict.icon} size={18} />
		</span>
		<div>
			<h3
				class={[
					'font-semibold',
					verdict.tone === 'good' && 'text-good-ink',
					verdict.tone === 'warning' && 'text-warning-ink',
					verdict.tone === 'critical' && 'text-critical-ink'
				]}
			>
				{verdict.title}
			</h3>
			<p class="mt-0.5 text-sm text-stone-700">{verdict.text}</p>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
		<Stat label="U-value" value={fmt(result.uValue, 2)} unit="W/m²K" hint="per EN ISO 6946" />
		<Stat
			label="Indoor dew point"
			value={fmt(result.dewPointIn)}
			unit="°C"
			hint="{fmt(wall.climate.tIn)} °C · {fmt(wall.climate.rhIn, 0)} % RH"
		/>
		<Stat
			label="Inner surface"
			value={fmt(result.tSi)}
			unit="°C"
			hint="{fmt(Math.min(100, result.surfaceRH), 0)} % RH at the inner surface"
		/>
		<Stat label="sd value" value={fmtSd(result.sdTotal)} unit="m" hint="effective layers" />
	</div>

	<div class="grid gap-3 sm:grid-cols-2">
		{@render risk(
			'drop',
			'text-critical',
			'Interstitial condensation',
			wall.criticalCondensation,
			wall.currentLimits.condensation
		)}
		{@render risk(
			'alert',
			'text-warning-ink',
			'Surface mould risk',
			wall.criticalMould,
			wall.currentLimits.mould
		)}
	</div>
</div>
