<!-- The large live view of the build-up: cross-section, Glaser diagram, risk chart or table -->
<script lang="ts">
	import BoundaryTable from '#lib/components/BoundaryTable.svelte';
	import VerdictPill from '#lib/components/VerdictPill.svelte';
	import GlaserChart from '#lib/components/charts/GlaserChart.svelte';
	import RiskChart from '#lib/components/charts/RiskChart.svelte';
	import WallSection from '#lib/components/charts/WallSection.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import { getWall } from '#lib/wall.svelte.ts';

	interface Props {
		/** Opens the layer list (small screens) */
		onaddlayer: () => void;
		/** Opens the result (small screens) */
		onresult: () => void;
		/** Opens the template library */
		onlibrary: () => void;
	}

	let { onaddlayer, onresult, onlibrary }: Props = $props();

	const wall = getWall();

	type View = 'section' | 'glaser' | 'risk' | 'table';
	const views: { value: View; label: string; icon: IconName; hint: string }[] = [
		{
			value: 'section',
			label: 'Section',
			icon: 'section',
			hint: 'Temperature and dew point across the build-up – hover or tap for details'
		},
		{
			value: 'glaser',
			label: 'Glaser',
			icon: 'chart',
			hint: 'Vapour pressure must not touch the saturation pressure'
		},
		{
			value: 'risk',
			label: 'Critical',
			icon: 'gauge',
			hint: 'At which outdoor temperature and indoor humidity does it get critical?'
		},
		{ value: 'table', label: 'Table', icon: 'table', hint: 'Values at the layer boundaries' }
	];

	let view = $state<View>('section');
	let current = $derived(views.find((v) => v.value === view)!);
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="flex h-11 shrink-0 items-stretch gap-2 border-b border-line pr-3 pl-1 sm:pl-2">
		<div role="tablist" aria-label="View" class="flex [scrollbar-width:none] overflow-x-auto">
			{#each views as option (option.value)}
				<button
					type="button"
					role="tab"
					aria-selected={view === option.value}
					onclick={() => (view = option.value)}
					class={[
						'-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 text-[13px] font-medium whitespace-nowrap transition',
						view === option.value
							? 'border-fg text-fg'
							: 'border-transparent text-fg-muted hover:text-fg'
					]}
				>
					<Icon name={option.icon} size={14} />
					<span class={[view !== option.value && 'max-sm:sr-only']}>{option.label}</span>
				</button>
			{/each}
		</div>
		<span class="flex-1"></span>
		<span class="flex items-center lg:hidden"><VerdictPill onclick={onresult} /></span>
	</div>
	<p class="hidden truncate px-4 pt-3 text-xs text-fg-subtle sm:block">{current.hint}</p>

	<div role="tabpanel" class="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
		{#if !wall.activeLayers.length}
			<div class="grid flex-1 place-items-center">
				<div class="flex max-w-xs flex-col items-center gap-3 text-center">
					<span class="text-fg-subtle">
						<Icon name="wall" size={28} strokeWidth={1.5} />
					</span>
					<p class="text-sm text-balance text-fg-muted">
						{wall.layers.length
							? 'All layers are deactivated – activate one to see the results.'
							: 'Add layers from inside to outside to see how temperature and moisture move through the wall.'}
					</p>
					{#if !wall.layers.length}
						<div class="flex flex-wrap justify-center gap-2">
							<Button variant="accent" icon="layers" onclick={onlibrary}>Choose a template</Button>
							<Button icon="plus" class="lg:hidden" onclick={onaddlayer}>Add layers</Button>
						</div>
					{/if}
				</div>
			</div>
		{:else if view === 'section'}
			<WallSection
				layers={wall.activeLayers}
				result={wall.result}
				climate={wall.climate}
				number={wall.layerNumber}
			/>
		{:else if view === 'glaser'}
			<GlaserChart layers={wall.activeLayers} result={wall.result} number={wall.layerNumber} />
		{:else if view === 'risk'}
			<RiskChart curve={wall.limitCurve} climate={wall.climate} />
		{:else}
			<div class="min-h-0 flex-1 scroll-thin overflow-auto">
				<BoundaryTable />
			</div>
		{/if}
	</div>
</div>
