<script lang="ts">
	import RangeField from '#lib/components/ui/RangeField.svelte';
	import SegmentedControl from '#lib/components/ui/SegmentedControl.svelte';
	import SelectField from '#lib/components/ui/SelectField.svelte';
	import { VAPOUR_EXCESS, type HumidityClass } from '#lib/physics/glaser.ts';
	import { CLIMATE_PRESETS, getWall, type ClimatePreset } from '#lib/wall.svelte.ts';

	const wall = getWall();

	const presetOptions = (Object.keys(CLIMATE_PRESETS) as ClimatePreset[]).map((key) => ({
		value: key,
		label: CLIMATE_PRESETS[key].label
	}));

	const classLabels: Record<HumidityClass, string> = {
		1: 'Storage, unoccupied',
		2: 'Dwellings, offices – normal use',
		3: 'Unknown or high occupancy',
		4: 'Kitchens, canteens, sports halls',
		5: 'Laundries, breweries, pools'
	};
	const classOptions = (Object.keys(VAPOUR_EXCESS) as `${HumidityClass}`[]).map((key) => ({
		value: key,
		label: `Class ${key}: ${classLabels[Number(key) as HumidityClass]} (+${VAPOUR_EXCESS[Number(key) as HumidityClass]} g/m³)`
	}));
</script>

<div class="@container flex flex-col gap-5">
	<div class="flex flex-wrap items-center gap-2">
		<SegmentedControl
			label="Outdoor conditions"
			bind:value={() => wall.climatePreset ?? '', (key) => key && wall.applyClimatePreset(key)}
			options={presetOptions}
		/>
	</div>

	<div class="grid gap-x-6 gap-y-5 @lg:grid-cols-2">
		<RangeField
			label="Indoor temperature"
			icon="thermometer"
			unit="°C"
			min={10}
			max={28}
			step={0.5}
			digits={1}
			accent="#eb6834"
			bind:value={wall.climateInput.tIn}
		/>
		<div class="flex flex-col gap-2">
			<RangeField
				label="Indoor humidity"
				icon="drop"
				unit="%"
				min={20}
				max={95}
				accent="#2a78d6"
				disabled={!!wall.humidityClass}
				bind:value={
					() => wall.climate.rhIn,
					(rhIn) => {
						wall.climateInput.rhIn = rhIn;
					}
				}
			/>
			<label class="flex items-center gap-2 text-sm text-stone-600">
				<input
					type="checkbox"
					class="size-4 accent-stone-800"
					checked={!!wall.humidityClass}
					onchange={(event) => wall.setHumidityClass(event.currentTarget.checked ? 2 : undefined)}
				/>
				Set automatically from outdoor climate
			</label>
			{#if wall.humidityClass}
				<SelectField
					label="Humidity class (EN ISO 13788)"
					value={String(wall.humidityClass)}
					options={classOptions}
					onchange={(key) => wall.setHumidityClass(Number(key) as HumidityClass)}
				/>
			{/if}
		</div>
		<RangeField
			label="Outdoor temperature"
			icon="thermometer"
			unit="°C"
			min={-30}
			max={40}
			step={0.5}
			digits={1}
			accent="#eb6834"
			bind:value={wall.climateInput.tOut}
		/>
		<RangeField
			label="Outdoor humidity"
			icon="drop"
			unit="%"
			min={30}
			max={100}
			accent="#2a78d6"
			bind:value={wall.climateInput.rhOut}
		/>
	</div>
</div>
