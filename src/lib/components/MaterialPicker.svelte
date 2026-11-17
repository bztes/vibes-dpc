<!-- Searchable material menu with category filters and λ/μ at a glance -->
<script lang="ts">
	import Button from '#lib/components/ui/Button.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { categoryOrder, categoryStyles } from '#lib/layer-style.ts';
	import { flip } from '#lib/flip.ts';
	import { fmt, searchMatcher } from '#lib/format.ts';
	import type { Material, MaterialCategory } from '#lib/physics/types.ts';

	interface Props {
		materials: Material[];
		/** ID of the selected material; empty for a custom material */
		value?: string;
		label: string;
		placeholder: string;
		/** `add` shows an "add" button instead of a field, `insert` a small round plus */
		variant?: 'field' | 'add' | 'insert';
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
	let popover = $state<HTMLElement>();
	/** Small screens show the menu as a bottom sheet */
	let sheet = $state(false);

	let selected = $derived(materials.find((material) => material.id === value));
	let categories = $derived(
		categoryOrder.filter((c) => materials.some((material) => material.category === c))
	);
	let results = $derived.by(() => {
		const matches = searchMatcher(search);
		return categoryOrder.flatMap((c) =>
			category && category !== c
				? []
				: materials.filter((material) => {
						if (material.category !== c) return false;
						return matches(`${material.name} ${categoryStyles[c].label}`);
					})
		);
	});

	function show() {
		sheet = matchMedia('(width < 40rem)').matches;
		open = true;
		search = '';
		category = undefined;
		highlighted = Math.max(0, results.indexOf(selected!));
		requestAnimationFrame(() => {
			// On touch screens the keyboard would cover the list
			if (!sheet) input?.focus();
			scrollToHighlighted();
		});
	}

	/** Moves the sheet to the end of the page so no layer card covers or fades it */
	function portal(node: HTMLElement) {
		document.body.append(node);
		const overflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		return () => {
			node.remove();
			document.documentElement.style.overflow = overflow;
		};
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
		if (!sheet) input?.focus();
	}
</script>

<svelte:window
	onclick={(event) => {
		const target = event.target as Node;
		if (open && !root?.contains(target) && !popover?.contains(target)) close(false);
	}}
	onkeydown={(event) => {
		if (open && event.key === 'Escape') close();
	}}
/>

<div class="relative" bind:this={root}>
	<button
		type="button"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={variant === 'add' ? placeholder : `${label}: ${selected?.name ?? placeholder}`}
		onclick={() => (open ? close() : show())}
		title={variant === 'insert' ? placeholder : undefined}
		class={[
			variant === 'insert'
				? [
						'mx-auto grid size-5 place-items-center rounded-full bg-surface ring-1 transition outline-none focus-visible:ring-2 focus-visible:ring-accent pointer-coarse:size-6',
						open
							? 'text-accent ring-accent'
							: 'text-fg-subtle ring-line-strong hover:text-accent hover:ring-accent'
					]
				: 'flex w-full items-center gap-2 text-left outline-none focus-visible:ring-4 focus-visible:ring-accent/25',
			variant === 'add' && 'h-11 px-4 text-sm font-medium text-accent transition hover:bg-accent/6',
			variant === 'field' &&
				'h-10 rounded-lg border border-line-strong bg-surface px-3 text-base transition hover:border-fg-subtle sm:h-9 sm:px-2.5 sm:text-sm',
			open && variant === 'field' && 'border-accent ring-4 ring-accent/15'
		]}
	>
		{#if variant === 'insert'}
			<Icon name="plus" size={12} strokeWidth={2.5} />
		{:else if variant === 'add'}
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
				<Icon name="sliders" size={13} class="text-fg-subtle" />
				<span class="min-w-0 flex-1 truncate text-fg-muted italic">{placeholder}</span>
			{/if}
			<Icon
				name="chevron"
				size={14}
				class={['text-fg-subtle transition-transform', open && 'rotate-180']}
			/>
		{/if}
	</button>

	{#if open}
		<div
			bind:this={popover}
			{@attach sheet && portal}
			class={[
				sheet && 'fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-[2px]'
			]}
		>
			<!-- Tapping the dimmed page closes the sheet -->
			{#if sheet}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div class="flex-1" onclick={() => close(false)}></div>
			{/if}
			<div
				{@attach !sheet && flip}
				role={sheet ? 'dialog' : undefined}
				aria-label={sheet ? label : undefined}
				class={[
					'flex flex-col overflow-hidden bg-surface text-fg',
					sheet
						? 'h-[80dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)] shadow-float'
						: 'absolute inset-x-0 top-full z-30 mt-1.5 min-w-72 rounded-lg shadow-float ring-1 ring-line'
				]}
			>
				{#if sheet}
					<div class="flex items-center justify-between gap-2 px-4 pt-2">
						<span class="font-semibold tracking-tight text-fg">{label}</span>
						<Button
							variant="ghost"
							icon="close"
							label="Close"
							onclick={() => close()}
							class="-mr-2 rounded-full"
						/>
					</div>
				{/if}
				<div
					class={[
						'flex items-center gap-2 px-3',
						sheet ? 'mx-3 rounded-lg bg-surface-3/70' : 'border-b border-line'
					]}
				>
					<Icon name="search" size={15} class="text-fg-subtle" />
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
						class="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-fg-subtle sm:h-10 sm:text-sm"
					/>
				</div>

				<div
					class={[
						'flex [scrollbar-width:none] gap-1.5 overflow-x-auto border-b border-line py-2',
						sheet ? 'px-3 py-3' : 'px-2'
					]}
				>
					{#each [undefined, ...categories] as c (c ?? 'all')}
						<button
							type="button"
							aria-pressed={category === c}
							onclick={() => pick(c)}
							class={[
								'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
								sheet ? 'py-2' : 'py-1',
								category === c
									? 'bg-inverse text-inverse-fg'
									: 'bg-surface-3/70 text-fg-muted hover:bg-surface-3 hover:text-fg'
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
					class={[
						'overflow-y-auto overscroll-contain p-1.5',
						sheet ? 'min-h-0 flex-1' : 'max-h-72'
					]}
				>
					{#each results as material, i (material.id)}
						{@const style = categoryStyles[material.category]}
						{#if !category && material.category !== results[i - 1]?.category}
							<li
								role="presentation"
								class="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-fg-subtle uppercase"
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
								'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm',
								sheet ? 'py-3' : 'py-2',
								i === highlighted ? 'bg-accent/10 text-fg' : 'text-fg-muted'
							]}
						>
							<span
								class="size-3.5 shrink-0 rounded ring-1 ring-black/10"
								style:background={style.fill}
							></span>
							<span class="min-w-0 flex-1 truncate">{material.name}</span>
							<span class="shrink-0 text-[11px] text-fg-subtle tabular-nums">
								λ {fmt(material.lambda, 3)} · μ {fmt(material.mu, 0)}
							</span>
							<Icon
								name="check"
								size={14}
								class={material.id === value ? 'text-accent' : 'invisible'}
							/>
						</li>
					{:else}
						<li class="px-3 py-6 text-center text-sm text-fg-muted">No matching materials</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>
