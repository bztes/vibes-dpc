<script lang="ts">
	import { dismiss } from '#lib/dismiss.ts';
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import RangeField from '#lib/components/ui/RangeField.svelte';
	import SegmentedControl from '#lib/components/ui/SegmentedControl.svelte';
	import { fmt } from '#lib/format.ts';
	import { VAPOUR_EXCESS, dewPoint, type HumidityClass } from '#lib/physics/glaser.ts';
	import { CLIMATE_PRESETS, getWall, type ClimatePreset } from '#lib/wall.svelte.ts';

	const wall = getWall();

	const presetIcons: Record<ClimatePreset, IconName> = {
		hot: 'sun',
		warm: 'cloudSun',
		mild: 'cloud',
		cold: 'snowflake',
		freezing: 'thermometerCold'
	};
	const presets = Object.keys(CLIMATE_PRESETS) as ClimatePreset[];

	let presetOpen = $state(false);

	const classLabels: Record<HumidityClass, string> = {
		1: 'Storage, unoccupied',
		2: 'Dwellings, offices – normal use',
		3: 'Unknown or high occupancy',
		4: 'Kitchens, canteens, sports halls',
		5: 'Laundries, breweries, pools'
	};
	const classOptions = [
		{ value: 'manual', label: 'Manual', title: 'Set the indoor humidity yourself' },
		...(Object.keys(VAPOUR_EXCESS) as `${HumidityClass}`[]).map((key) => ({
			value: key,
			label: key,
			title: `Class ${key}: ${classLabels[Number(key) as HumidityClass]}`
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
	{@const current = wall.climatePreset}
	<div class="relative" {@attach presetOpen && dismiss(() => (presetOpen = false))}>
		<button
			type="button"
			aria-label="Outdoor preset: {current ? CLIMATE_PRESETS[current].label : 'Custom'}"
			aria-haspopup="menu"
			aria-expanded={presetOpen}
			onclick={() => (presetOpen = !presetOpen)}
			class={[
				'flex h-6 items-center gap-1 rounded-md pr-1 pl-1.5 text-[11px] font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-accent',
				presetOpen
					? 'bg-surface-3 text-fg'
					: 'bg-surface-3/60 text-fg-muted hover:bg-surface-3 hover:text-fg'
			]}
		>
			{#if current}<Icon name={presetIcons[current]} size={12} />{/if}
			{current ? CLIMATE_PRESETS[current].label : 'Custom'}
			<Icon
				name="chevron"
				size={12}
				class={['text-fg-subtle transition-transform', presetOpen && 'rotate-180']}
			/>
		</button>
		{#if presetOpen}
			<div
				role="menu"
				aria-label="Outdoor presets"
				class="absolute top-full left-0 z-30 mt-1.5 flex w-56 flex-col rounded-xl bg-surface p-1 shadow-float ring-1 ring-line"
			>
				{#each presets as key (key)}
					{@const preset = CLIMATE_PRESETS[key]}
					<button
						type="button"
						role="menuitemradio"
						aria-checked={current === key}
						onclick={() => {
							wall.applyClimatePreset(key);
							presetOpen = false;
						}}
						class={[
							'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition',
							current === key
								? 'bg-accent/10 text-accent'
								: 'text-fg-muted hover:bg-surface-3 hover:text-fg'
						]}
					>
						<Icon name={presetIcons[key]} size={15} />
						<span class="flex-1">{preset.label}</span>
						<span class="text-[11px] text-fg-subtle tabular-nums">
							{fmt(preset.tOut)} °C · {preset.rhOut} %
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<div class="flex flex-col">
	<section class="flex flex-col gap-2.5 border-b border-line p-4">
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
			disabled={!!wall.humidityClass}
			bind:value={
				() => wall.climate.rhIn,
				(rhIn) => {
					wall.climateInput.rhIn = rhIn;
				}
			}
		/>
		<div class="flex flex-col gap-1.5">
			<span class="text-xs text-fg-muted">Humidity class (EN ISO 13788)</span>
			<SegmentedControl
				label="Humidity class (EN ISO 13788)"
				fill
				value={wall.humidityClass ? String(wall.humidityClass) : 'manual'}
				options={classOptions}
				onchange={(key) =>
					wall.setHumidityClass(key === 'manual' ? undefined : (Number(key) as HumidityClass))}
			/>
			{#if wall.humidityClass}
				<span class="text-[11px] text-fg-subtle">
					{classLabels[wall.humidityClass]} · vapour excess +{VAPOUR_EXCESS[wall.humidityClass]} g/m³
				</span>
			{/if}
		</div>
	</section>

	<section class="flex flex-col gap-2.5 p-4">
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
