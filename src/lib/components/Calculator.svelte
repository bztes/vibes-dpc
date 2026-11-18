<!--
	Full-screen workbench. Large screens: layers & climate | live canvas | result.
	Small screens: the canvas on top and a bottom sheet with tabs below it.
	The sheet uses `display: contents` on large screens, so its panels become grid columns.
-->
<script lang="ts">
	import type { ClientUser } from '#lib/catalog.remote.ts';
	import { onMount, untrack, type Snippet } from 'svelte';
	import { cacheForOffline } from '#lib/offline.ts';
	import { fmt } from '#lib/format.ts';
	import ChartCanvas from '#lib/components/ChartCanvas.svelte';
	import ClimatePanel from '#lib/components/ClimatePanel.svelte';
	import LayerEditor from '#lib/components/LayerEditor.svelte';
	import Library from '#lib/components/Library.svelte';
	import ResultSummary from '#lib/components/ResultSummary.svelte';
	import WorkbenchHeader from '#lib/components/WorkbenchHeader.svelte';
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import type { Assembly, Catalog } from '#lib/physics/types.ts';
	import { verdictStyles } from '#lib/verdict.ts';
	import { WallModel, setWall, templatePath } from '#lib/wall.svelte.ts';

	interface Props {
		catalog: Catalog;
		user: ClientUser | null;
		/** The signed-in user's build-ups; `null` when signed out */
		configs: Assembly[] | null;
		/** Template or saved build-up to show; without it the build-up starts empty */
		templateId?: string;
	}

	let { catalog, user, configs, templateId }: Props = $props();

	const wall = setWall(
		new WallModel(
			() => catalog,
			() => configs,
			untrack(() => templateId)
		)
	);

	// Browser storage is only available after hydration
	onMount(() => {
		wall.restore(templateId);
		// Every build-up can then be opened offline
		void cacheForOffline(wall.templates.map(templatePath));
	});

	// Follow navigation between build-ups; saving one updates the URL but is already shown
	$effect(() => {
		const id = templateId ?? '';
		untrack(() => {
			if (id === wall.templateId) return;
			if (id) wall.loadTemplate(id);
			else wall.clear();
		});
	});

	type Tab = 'layers' | 'climate' | 'result';
	const tabs: { value: Tab; label: string; icon: IconName }[] = [
		{ value: 'layers', label: 'Layers', icon: 'layers' },
		{ value: 'climate', label: 'Climate', icon: 'thermometer' },
		{ value: 'result', label: 'Result', icon: 'gauge' }
	];
	let tab = $state<Tab>('layers');
	/** Small screens: the sheet covers the canvas */
	let sheetOpen = $state(false);

	let library = $state<Library>();
	let verdict = $derived(wall.verdict);

	/** Large screens: sidebar sections folded down to their summary */
	let collapsed = $state({ layers: false, result: false, climate: false });

	// Drag the sheet handle up or down; a tap toggles it
	let dragStart: number | undefined;
	function onpointerdown(event: PointerEvent) {
		dragStart = event.clientY;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}
	function onpointerup(event: PointerEvent) {
		if (dragStart === undefined) return;
		const dy = event.clientY - dragStart;
		dragStart = undefined;
		if (Math.abs(dy) < 8) sheetOpen = !sheetOpen;
		else sheetOpen = dy < 0;
	}

	function show(next: Tab) {
		tab = next;
		if (next === 'layers' && !wall.layers.length) sheetOpen = true;
	}
</script>

{#snippet collapsibleHead(
	icon: IconName,
	title: string,
	key: keyof typeof collapsed,
	summary: Snippet
)}
	<button
		type="button"
		aria-expanded={!collapsed[key]}
		onclick={() => (collapsed[key] = !collapsed[key])}
		class="sticky top-0 z-10 flex h-11 w-full shrink-0 items-center gap-2 border-b border-line bg-surface-2 px-4 text-left text-[13px] font-semibold hover:bg-surface-3 max-lg:hidden [section+section>&]:border-t"
	>
		<Icon name={icon} size={15} class="text-fg-subtle" />
		{title}
		<span
			class="min-w-0 flex-1 truncate text-right text-xs font-normal text-fg-subtle tabular-nums"
		>
			{#if collapsed[key]}{@render summary()}{/if}
		</span>
		<Icon
			name="chevron"
			size={14}
			class={['shrink-0 text-fg-subtle transition-transform', collapsed[key] && '-rotate-90']}
		/>
	</button>
{/snippet}

{#snippet resultSummary()}
	<span class={['font-medium', verdictStyles[verdict.tone].ink]}>{verdict.title}</span>
	· U {fmt(wall.result.uValue, 2)}
{/snippet}

{#snippet climateSummary()}
	In {fmt(wall.climate.tIn)} °C / {fmt(wall.climate.rhIn, 0)} % · Out {fmt(wall.climate.tOut)} °C /
	{fmt(wall.climate.rhOut, 0)} %
{/snippet}

{#snippet layerCount()}
	{wall.layers.length}
	{wall.layers.length === 1 ? 'layer' : 'layers'}
	{#if wall.layers.length}· {fmt(wall.result.totalThickness, 0)} mm{/if}
{/snippet}

<div class="flex h-dvh flex-col overflow-hidden bg-surface">
	<WorkbenchHeader {user} onlibrary={() => library?.open()} />

	<div
		class="relative flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[21rem_minmax(0,1fr)_21rem] lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[25rem_minmax(0,1fr)_24rem]"
	>
		<section
			aria-label="Live view"
			class={[
				'shrink-0 overflow-hidden bg-surface transition-[height] duration-300 ease-out lg:col-start-2 lg:row-start-1 lg:h-auto',
				sheetOpen ? 'h-0' : 'h-[clamp(16rem,46dvh,30rem)]'
			]}
		>
			<ChartCanvas
				onaddlayer={() => show('layers')}
				onresult={() => show('result')}
				onlibrary={() => library?.open()}
			/>
		</section>

		<div
			class="relative z-10 flex min-h-0 flex-1 flex-col border-t border-line bg-surface shadow-[0_-12px_32px_-16px_rgb(0_0_0/0.3)] lg:contents"
		>
			<!-- Small screens: handle and tabs of the sheet -->
			<div class="shrink-0 border-b border-line lg:hidden">
				<button
					type="button"
					aria-label={sheetOpen ? 'Show chart' : 'Expand panel'}
					aria-expanded={sheetOpen}
					{onpointerdown}
					{onpointerup}
					class="flex h-6 w-full touch-none items-center justify-center"
				>
					<span class="h-1 w-10 rounded-full bg-line-strong"></span>
				</button>
				<div role="tablist" aria-label="Panel" class="flex px-1">
					{#each tabs as option (option.value)}
						<button
							type="button"
							role="tab"
							aria-selected={tab === option.value}
							onclick={() => (tab = option.value)}
							class={[
								'relative -mb-px flex h-10 flex-1 items-center justify-center gap-1.5 border-b-2 text-sm font-medium transition',
								tab === option.value ? 'border-fg text-fg' : 'border-transparent text-fg-muted'
							]}
						>
							<Icon name={option.icon} size={15} />
							{option.label}
							{#if option.value === 'result' && wall.activeLayers.length}
								<span class={['size-2 rounded-full', verdictStyles[verdict.tone].dot]}></span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<aside
				aria-label="Build-up and climate"
				class={[
					'flex min-h-0 flex-col max-lg:flex-1 lg:col-start-1 lg:row-start-1 lg:border-r lg:border-line',
					tab === 'result' && 'max-lg:hidden'
				]}
			>
				<div
					class="flex min-h-0 flex-1 scroll-thin flex-col overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))]"
				>
					<section class={[tab !== 'layers' && 'max-lg:hidden']}>
						{@render collapsibleHead('layers', 'Build-up', 'layers', layerCount)}
						<div class={[collapsed.layers && 'lg:hidden']}>
							<LayerEditor />
						</div>
					</section>
					<section class={[tab !== 'climate' && 'max-lg:hidden']}>
						{@render collapsibleHead('thermometer', 'Climate', 'climate', climateSummary)}
						<div class={[collapsed.climate && 'lg:hidden']}>
							<ClimatePanel />
						</div>
					</section>
				</div>
			</aside>

			<aside
				aria-label="Result"
				class={[
					'flex min-h-0 scroll-thin flex-col overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))] max-lg:flex-1 lg:col-start-3 lg:row-start-1 lg:border-l lg:border-line',
					tab !== 'result' && 'max-lg:hidden'
				]}
			>
				{#if wall.activeLayers.length}
					<section>
						{@render collapsibleHead('gauge', 'Result', 'result', resultSummary)}
						<div class={[collapsed.result && 'lg:hidden']}>
							<ResultSummary />
						</div>
					</section>
				{:else}
					<p class="p-6 text-center text-sm text-fg-muted">Add layers to see the result.</p>
				{/if}
			</aside>
		</div>
	</div>
</div>

<Library bind:this={library} />
