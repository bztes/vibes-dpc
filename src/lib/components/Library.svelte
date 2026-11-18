<!-- Switcher for templates and the user's build-ups, opened from the toolbar or with ⌘K / Ctrl+K -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import LayerStrip from '#lib/components/LayerStrip.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { searchMatcher } from '#lib/format.ts';
	import type { Assembly } from '#lib/physics/types.ts';
	import { getWall, templatePath, type Template } from '#lib/wall.svelte.ts';

	const wall = getWall();

	let dialog = $state<HTMLDialogElement>();
	let input = $state<HTMLInputElement>();
	let search = $state('');

	export function open() {
		search = '';
		dialog?.showModal();
		// On touch screens the keyboard would cover the list
		if (matchMedia('(pointer: fine)').matches) input?.focus();
		else input?.blur();
	}

	let matcher = $derived(searchMatcher(search));
	const matches = (assembly: Assembly) =>
		matcher(`${assembly.name} ${assembly.description} ${assembly.keywords.join(' ')}`);

	let own = $derived(wall.templates.filter((t) => t.config && matches(t)));
	let templates = $derived(wall.templates.filter((t) => !t.config && matches(t)));

	async function choose(template?: Template) {
		dialog?.close();
		await goto(templatePath(template));
	}

	const thickness = (assembly: Assembly) =>
		Math.round(assembly.layers.filter((l) => !l.disabled).reduce((sum, l) => sum + l.thickness, 0));
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			if (dialog?.open) dialog.close();
			else open();
		}
	}}
/>

{#snippet entry(assembly: Template, icon: 'home' | 'save')}
	{@const current = assembly.id === wall.templateId}
	<li>
		<button
			type="button"
			onclick={() => choose(assembly)}
			class={[
				'group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors focus-visible:bg-surface-2 focus-visible:outline-none',
				current ? 'bg-accent/6' : 'hover:bg-surface-2'
			]}
		>
			<Icon name={icon} size={15} class="shrink-0 self-start text-fg-subtle" />
			<span class="min-w-0 flex-1">
				<span class="flex items-baseline gap-2">
					<span class="truncate text-sm font-medium">{assembly.name}</span>
					{#if current}<span class="shrink-0 text-[11px] font-medium text-accent">Open</span>{/if}
				</span>
				{#if assembly.description}
					<span class="mt-0.5 line-clamp-1 text-xs text-fg-muted">{assembly.description}</span>
				{/if}
				<span class="mt-1 block truncate text-[11px] text-fg-subtle tabular-nums">
					{[
						`${assembly.layers.length} layers`,
						`${thickness(assembly)} mm`,
						...assembly.keywords.slice(0, 3)
					].join(' · ')}
				</span>
			</span>
			<LayerStrip layers={assembly.layers} class="w-20 shrink-0 sm:w-32" />
			<Icon
				name="chevronRight"
				size={15}
				class="shrink-0 text-fg-subtle transition group-hover:translate-x-0.5 group-hover:text-fg"
			/>
		</button>
	</li>
{/snippet}

<dialog
	bind:this={dialog}
	aria-label="Build-ups"
	closedby="any"
	class="mx-auto flex-col overflow-hidden bg-surface p-0 text-fg shadow-float ring-1 ring-line backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex max-sm:mt-auto max-sm:mb-0 max-sm:h-[88dvh] max-sm:w-full max-sm:max-w-none max-sm:rounded-t-2xl sm:mt-[8vh] sm:max-h-[min(44rem,84vh)] sm:w-[min(44rem,calc(100%-2rem))] sm:rounded-xl"
>
	<div class="flex shrink-0 items-center gap-2 border-b border-line px-4">
		<Icon name="search" size={17} class="text-fg-subtle" />
		<input
			bind:this={input}
			bind:value={search}
			type="search"
			autocomplete="off"
			placeholder="Search templates and build-ups …"
			aria-label="Search build-ups"
			class="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
		/>
		<kbd
			class="hidden rounded-md px-1.5 py-0.5 text-[11px] font-medium text-fg-subtle ring-1 ring-line sm:block"
			>Esc</kbd
		>
		<form method="dialog" class="sm:hidden">
			<Button type="submit" variant="ghost" icon="close" label="Close" class="-mr-2 rounded-full" />
		</form>
	</div>

	<div
		class="flex min-h-0 flex-1 scroll-thin flex-col overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))]"
	>
		{#if !search}
			<button
				type="button"
				onclick={() => choose()}
				class="flex items-center gap-4 border-b border-line px-4 py-3 text-left transition-colors hover:bg-surface-2"
			>
				<span class="grid size-[15px] place-items-center text-accent">
					<Icon name="plus" size={15} />
				</span>
				<span>
					<span class="block text-sm font-medium">Empty build-up</span>
					<span class="block text-xs text-fg-muted"
						>Start from scratch and add the layers yourself</span
					>
				</span>
			</button>
		{/if}

		{#if own.length}
			<section>
				<h2
					class="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-2 text-[11px] font-medium tracking-wide text-fg-subtle uppercase backdrop-blur"
				>
					My build-ups <span class="font-normal normal-case"
						>· {wall.signedIn ? 'saved in your account' : 'saved in this browser'}</span
					>
				</h2>
				<ul class="divide-y divide-line border-b border-line">
					{#each own as assembly (assembly.id)}{@render entry(assembly, 'save')}{/each}
				</ul>
			</section>
		{/if}

		{#if templates.length}
			<section>
				<h2
					class="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-2 text-[11px] font-medium tracking-wide text-fg-subtle uppercase backdrop-blur"
				>
					Templates
				</h2>
				<ul class="divide-y divide-line border-b border-line">
					{#each templates as assembly (assembly.id)}{@render entry(assembly, 'home')}{/each}
				</ul>
			</section>
		{/if}

		{#if search && !own.length && !templates.length}
			<p class="py-10 text-center text-sm text-fg-muted">Nothing matches “{search}”.</p>
		{/if}
	</div>
</dialog>
