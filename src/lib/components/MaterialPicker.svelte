<!-- Searchable material menu with category filters and λ/μ at a glance -->
<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';
	import { categoryOrder, categoryStyles } from '#lib/layer-style.ts';
	import { fmt } from '#lib/format.ts';
	import type { Material, MaterialCategory } from '#lib/physics/types.ts';

	interface Props {
		materials: Material[];
		/** ID of the selected material; empty for a custom material */
		value?: string;
		label: string;
		placeholder: string;
		/** `add` shows a dashed "add" button instead of a field */
		variant?: 'field' | 'add';
		onselect: (id: string) => void;
	}

	let { materials, value = '', label, placeholder, variant = 'field', onselect }: Props = $props();

	const id = $props.id();

	let open = $state(false);
	let search = $state('');
	let category = $state<MaterialCategory>();
	let highlighted = $state(0);
	let root = $state<HTMLElement>();
	let input = $state<HTMLInputElement>();
	let list = $state<HTMLElement>();

	let selected = $derived(materials.find((material) => material.id === value));
	let categories = $derived(
		categoryOrder.filter((c) => materials.some((material) => material.category === c))
	);
	let results = $derived.by(() => {
		const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
		return categoryOrder.flatMap((c) =>
			category && category !== c
				? []
				: materials.filter((material) => {
						if (material.category !== c) return false;
						const text = `${material.name} ${categoryStyles[c].label}`.toLowerCase();
						return terms.every((term) => text.includes(term));
					})
		);
	});

	function show() {
		open = true;
		search = '';
		category = undefined;
		highlighted = Math.max(0, results.indexOf(selected!));
		requestAnimationFrame(() => {
			input?.focus();
			scrollToHighlighted();
		});
	}

	function close(refocus = true) {
		open = false;
		if (refocus) root?.querySelector<HTMLElement>('button')?.focus();
	}

	function choose(material: Material) {
		onselect(material.id);
		close();
	}

	function scrollToHighlighted() {
		list?.querySelector(`[data-index="${highlighted}"]`)?.scrollIntoView({ block: 'nearest' });
	}

	function keydown(event: KeyboardEvent) {
		const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
		if (step && results.length) {
			event.preventDefault();
			highlighted = (highlighted + step + results.length) % results.length;
			scrollToHighlighted();
		} else if (event.key === 'Enter' && results[highlighted]) {
			event.preventDefault();
			choose(results[highlighted]);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			close();
		}
	}

	function pick(c?: MaterialCategory) {
		category = c;
		highlighted = 0;
		input?.focus();
	}
</script>

<svelte:window
	onclick={(event) => {
		if (open && !root?.contains(event.target as Node)) close(false);
	}}
/>

<div class="relative" bind:this={root}>
	<button
		type="button"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={variant === 'add' ? placeholder : `${label}: ${selected?.name ?? placeholder}`}
		onclick={() => (open ? close() : show())}
		class={[
			'flex w-full items-center gap-2 rounded-lg text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30',
			variant === 'add'
				? 'h-11 justify-center border border-dashed border-stone-300 font-medium text-stone-500 hover:border-stone-400 hover:bg-white hover:text-stone-800'
				: 'h-9 border border-stone-300 bg-white px-2.5 hover:border-stone-400',
			open && 'border-sky-500 ring-2 ring-sky-500/20'
		]}
	>
		{#if variant === 'add'}
			<Icon name="plus" size={15} />
			{placeholder}
		{:else}
			{#if selected}
				<span
					class="size-3 shrink-0 rounded-sm ring-1 ring-black/10"
					style:background={categoryStyles[selected.category].fill}
				></span>
				<span class="min-w-0 flex-1 truncate">{selected.name}</span>
			{:else}
				<Icon name="sliders" size={13} class="text-stone-400" />
				<span class="min-w-0 flex-1 truncate text-stone-500 italic">{placeholder}</span>
			{/if}
			<Icon
				name="chevron"
				size={14}
				class={['text-stone-400 transition-transform', open && 'rotate-180']}
			/>
		{/if}
	</button>

	{#if open}
		<div
			class="absolute inset-x-0 top-full z-30 mt-1.5 flex min-w-72 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10"
		>
			<div class="flex items-center gap-2 border-b border-stone-100 px-3">
				<Icon name="search" size={15} class="text-stone-400" />
				<input
					bind:this={input}
					bind:value={search}
					oninput={() => (highlighted = 0)}
					onkeydown={keydown}
					type="text"
					role="combobox"
					autocomplete="off"
					spellcheck="false"
					placeholder="Search materials …"
					aria-label="Search materials"
					aria-expanded="true"
					aria-controls="{id}-list"
					aria-activedescendant={results[highlighted] ? `${id}-${highlighted}` : undefined}
					class="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
				/>
			</div>

			<div
				class="flex [scrollbar-width:none] gap-1 overflow-x-auto border-b border-stone-100 px-2 py-2"
			>
				{#each [undefined, ...categories] as c (c ?? 'all')}
					<button
						type="button"
						aria-pressed={category === c}
						onclick={() => pick(c)}
						class={[
							'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
							category === c
								? 'bg-stone-800 text-white'
								: 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'
						]}
					>
						{#if c}
							<span
								class="size-2 rounded-full ring-1 ring-black/10"
								style:background={categoryStyles[c].fill}
							></span>
							{categoryStyles[c].label}
						{:else}
							All
						{/if}
					</button>
				{/each}
			</div>

			<ul
				bind:this={list}
				id="{id}-list"
				role="listbox"
				aria-label={label}
				class="max-h-72 overflow-y-auto p-1"
			>
				{#each results as material, i (material.id)}
					{@const style = categoryStyles[material.category]}
					{#if !category && material.category !== results[i - 1]?.category}
						<li
							role="presentation"
							class="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-stone-400 uppercase"
						>
							{style.label}
						</li>
					{/if}
					<li
						id="{id}-{i}"
						data-index={i}
						role="option"
						tabindex="-1"
						aria-selected={material.id === value}
						onclick={() => choose(material)}
						onkeydown={keydown}
						onpointermove={() => (highlighted = i)}
						class={[
							'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm',
							i === highlighted ? 'bg-sky-50 text-stone-900' : 'text-stone-700'
						]}
					>
						<span
							class="size-3.5 shrink-0 rounded ring-1 ring-black/10"
							style:background={style.fill}
						></span>
						<span class="min-w-0 flex-1 truncate">{material.name}</span>
						<span class="shrink-0 text-[11px] text-stone-400 tabular-nums">
							λ {fmt(material.lambda, 3)} · μ {fmt(material.mu, 0)}
						</span>
						<Icon
							name="check"
							size={14}
							class={material.id === value ? 'text-sky-600' : 'invisible'}
						/>
					</li>
				{:else}
					<li class="px-3 py-6 text-center text-sm text-stone-500">No matching materials</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
