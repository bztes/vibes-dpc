<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import BoundaryTable from '#lib/components/BoundaryTable.svelte';
	import ClimatePanel from '#lib/components/ClimatePanel.svelte';
	import LayerEditor from '#lib/components/LayerEditor.svelte';
	import ResultSummary from '#lib/components/ResultSummary.svelte';
	import TemplateBar from '#lib/components/TemplateBar.svelte';
	import GlaserChart from '#lib/components/charts/GlaserChart.svelte';
	import RiskChart from '#lib/components/charts/RiskChart.svelte';
	import WallSection from '#lib/components/charts/WallSection.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import type { Catalog } from '#lib/physics/types.ts';
	import { WallModel, setWall } from '#lib/wall.svelte.ts';

	interface Props {
		catalog: Catalog;
		admin: boolean;
		/** Template or saved build-up to show; without it the build-up starts empty */
		templateId?: string;
	}

	let { catalog, admin, templateId }: Props = $props();

	const wall = setWall(
		new WallModel(
			() => catalog,
			untrack(() => templateId)
		)
	);

	// Browser storage is only available after hydration
	onMount(() => wall.restore(templateId));

	// Follow navigation between build-ups; saving one updates the URL but is already shown
	$effect(() => {
		const id = templateId ?? '';
		untrack(() => {
			if (id === wall.templateId) return;
			if (id) wall.loadTemplate(id);
			else wall.clear();
		});
	});
</script>

<main class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
	<TemplateBar {admin} />

	<div class="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
		<div class="flex flex-col gap-6">
			<Card title="Climate" icon="thermometer">
				<ClimatePanel />
			</Card>

			<Card title="Build-up" subtitle="Layers from inside to outside" icon="layers">
				{#snippet actions()}
					{#if wall.template && wall.modified}
						<Button
							size="sm"
							variant="ghost"
							icon="reset"
							onclick={() => wall.loadTemplate(wall.templateId)}
							>{wall.template.config ? 'Last saved' : 'Template'}</Button
						>
					{/if}
				{/snippet}
				<LayerEditor />
			</Card>
		</div>

		<div class="flex min-w-0 flex-col gap-6">
			{#if wall.activeLayers.length}
				<Card title="Result">
					<ResultSummary />
				</Card>

				<Card
					title="Cross-section"
					subtitle="Temperature and dew point across the build-up – hover for details"
				>
					<WallSection
						layers={wall.activeLayers}
						result={wall.result}
						climate={wall.climate}
						number={wall.layerNumber}
					/>
					<details class="group mt-4">
						<summary class="cursor-pointer text-sm font-medium text-stone-600 hover:text-stone-900">
							Values at layer boundaries
						</summary>
						<div class="mt-3"><BoundaryTable /></div>
					</details>
				</Card>

				<Card
					title="Critical conditions"
					subtitle="At which outdoor temperature and indoor humidity does it get critical?"
				>
					<RiskChart curve={wall.limitCurve} climate={wall.climate} />
				</Card>

				<Card
					title="Glaser diagram"
					subtitle="Vapour pressure must not touch the saturation pressure"
				>
					<GlaserChart layers={wall.activeLayers} result={wall.result} number={wall.layerNumber} />
				</Card>
			{:else}
				<div
					class="grid min-h-64 place-items-center rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500"
				>
					{wall.layers.length
						? 'All layers are deactivated – activate one to see the results.'
						: 'Add layers to the build-up to see the results.'}
				</div>
			{/if}
		</div>
	</div>

	<Card title="How it works" icon="info">
		<div class="grid gap-6 text-sm text-stone-600 md:grid-cols-3">
			<div>
				<h3 class="mb-1 font-semibold text-stone-800">Temperature profile</h3>
				<p>
					The temperature drops across each layer in proportion to its thermal resistance R = d/λ.
					Surface resistances are R<sub>si</sub> = 0.25 and R<sub>se</sub> = 0.04 m²K/W (0.08 behind a
					ventilation gap). Layers outside a ventilated air gap are ignored.
				</p>
			</div>
			<div>
				<h3 class="mb-1 font-semibold text-stone-800">Dew point & condensation</h3>
				<p>
					The indoor air has a dew point (e.g. 9.3 °C at 20 °C / 50 %). Reaching it inside the
					build-up alone is not a problem – what matters is how much vapour gets there. The Glaser
					method compares the vapour pressure with the saturation pressure; where they meet,
					condensation forms.
				</p>
			</div>
			<div>
				<h3 class="mb-1 font-semibold text-stone-800">Limitations</h3>
				<p>
					A steady-state estimate (EN ISO 13788) without capillary transport, moisture storage or
					thermal bridges. Capillary-active internal insulation is rated conservatively. For a
					detailed assessment use a hygrothermal simulation (e.g. WUFI).
				</p>
			</div>
		</div>
	</Card>
</main>
