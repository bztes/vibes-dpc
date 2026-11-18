<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import PillMenu from '#lib/components/ui/PillMenu.svelte';
	import RangeField from '#lib/components/ui/RangeField.svelte';
	import { fmt } from '#lib/format.ts';
	import { VAPOUR_EXCESS, dewPoint, type HumidityClass } from '#lib/physics/glaser.ts';
	import { CLIMATE_PRESETS, getWall, type ClimatePreset } from '#lib/wall.svelte.ts';

	const wall = getWall();

	const presetIcons: Record<ClimatePreset, IconName> = {
		warm: 'sun',
		mild: 'cloudSun',
		cool: 'cloud',
		frost: 'cloudSnow',
		cold: 'snowflake',
		freezing: 'thermometerCold'
	};
	const presetOptions = (Object.keys(CLIMATE_PRESETS) as ClimatePreset[]).map((key) => ({
		value: key,
		label: CLIMATE_PRESETS[key].label,
		icon: presetIcons[key],
		hint: `${fmt(CLIMATE_PRESETS[key].tOut)} °C · ${CLIMATE_PRESETS[key].rhOut} %`
	}));

	const classLabels: Record<HumidityClass, string> = {
		1: 'Storage, unoccupied',
		2: 'Dwellings, offices – normal use',
		3: 'Unknown or high occupancy',
		4: 'Kitchens, canteens, sports halls',
		5: 'Laundries, breweries, pools'
	};
	const classOptions = [
		{ value: 'manual', label: 'Manual', description: 'Set the indoor humidity yourself' },
		...(Object.keys(VAPOUR_EXCESS) as `${HumidityClass}`[]).map((key) => ({
			value: key,
			label: `Class ${key}`,
			description: classLabels[Number(key) as HumidityClass],
			hint: `+${VAPOUR_EXCESS[Number(key) as HumidityClass]} g/m³`
		}))
	];

	let dewOut = $derived(dewPoint(wall.result.pvOut));
</script>

{#snippet zone(title: string, icon: IconName, tint: string, dew: number, extra?: Snippet)}
	<div class="flex items-center gap-2">
		<h3 class="flex items-center gap-2 text-[13px] font-semibold">
			<span class={['grid size-6 place-items-center rounded-md', tint]}>
				<Icon name={icon} size={13} />
			</span>
			{title}
		</h3>
		{@render extra?.()}
		<span class="flex-1"></span>
		<span class="text-[11px] text-fg-subtle tabular-nums" title="Dew point of the air">
			<Icon name="drop" size={10} class="inline align-[-1px]" /> dew point {fmt(dew)} °C
		</span>
	</div>
{/snippet}

{#snippet presetPicker()}
	<PillMenu
		label="Outdoor preset"
		value={wall.climatePreset}
		options={presetOptions}
		placeholder="Custom"
		onchange={(key) => wall.applyClimatePreset(key)}
	/>
{/snippet}

{#snippet vapourExcess()}
	{#if wall.humidityClass}
		<p class="truncate py-0.5 text-[11px] text-fg-subtle">
			Vapour excess +{VAPOUR_EXCESS[wall.humidityClass]} g/m³ over outside
		</p>
	{/if}
{/snippet}

{#snippet humidityClass()}
	<PillMenu
		label="Humidity class (EN ISO 13788)"
		value={wall.humidityClass ? String(wall.humidityClass) : 'manual'}
		options={classOptions}
		width="w-64"
		onchange={(key) =>
			wall.setHumidityClass(key === 'manual' ? undefined : (Number(key) as HumidityClass))}
	/>
{/snippet}

<div class="flex flex-col">
	<section class="flex flex-col gap-2 border-b border-line px-4 py-3">
		{@render zone('Inside', 'home', 'bg-temp/15 text-temp', wall.result.dewPointIn)}
		<RangeField
			label="Temperature"
			icon="thermometer"
			unit="°C"
			min={10}
			max={28}
			step={0.5}
			digits={1}
			accent="var(--temp)"
			bind:value={wall.climateInput.tIn}
		/>
		<RangeField
			label="Humidity"
			icon="drop"
			unit="%"
			min={20}
			max={95}
			accent="var(--dew)"
			extra={humidityClass}
			children={wall.humidityClass ? vapourExcess : undefined}
			bind:value={
				() => wall.climate.rhIn,
				(rhIn) => {
					wall.climateInput.rhIn = rhIn;
				}
			}
		/>
	</section>

	<section class="flex flex-col gap-2 px-4 py-3">
		{@render zone('Outside', 'cloud', 'bg-dew/15 text-dew', dewOut, presetPicker)}
		<RangeField
			label="Temperature"
			icon="thermometer"
			unit="°C"
			min={-30}
			max={40}
			step={0.5}
			digits={1}
			accent="var(--temp)"
			bind:value={wall.climateInput.tOut}
		/>
		<RangeField
			label="Humidity"
			icon="drop"
			unit="%"
			min={30}
			max={100}
			accent="var(--dew)"
			bind:value={wall.climateInput.rhOut}
		/>
	</section>
</div>
