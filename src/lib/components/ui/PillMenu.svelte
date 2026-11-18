<!-- Small pill button that opens a menu to pick one option, e.g. in a panel header row -->
<script lang="ts" module>
	import type { IconName } from './Icon.svelte';

	export interface PillMenuOption<T extends string> {
		value: T;
		label: string;
		/** Shown on the button instead of the label */
		short?: string;
		/** Second line under the label */
		description?: string;
		/** Right-aligned detail, e.g. the values behind a preset */
		hint?: string;
		icon?: IconName;
	}
</script>

<script lang="ts" generics="T extends string">
	import { dismiss } from '#lib/dismiss.ts';
	import { flip } from '#lib/flip.ts';
	import Icon from './Icon.svelte';

	interface Props {
		value: T | undefined;
		options: PillMenuOption<T>[];
		label: string;
		/** Button text when the value matches no option */
		placeholder?: string;
		/** Tailwind width of the menu */
		width?: string;
		onchange: (value: T) => void;
	}

	let { value, options, label, placeholder = '', width = 'w-56', onchange }: Props = $props();

	let open = $state(false);
	let current = $derived(options.find((option) => option.value === value));
	let text = $derived(current ? (current.short ?? current.label) : placeholder);
</script>

<div class="relative min-w-0" {@attach open && dismiss(() => (open = false))}>
	<button
		type="button"
		aria-label="{label}: {text}"
		title={label}
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
		class={[
			'flex h-6 max-w-full items-center gap-1 rounded-md pr-1 pl-1.5 text-[11px] font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-accent',
			open
				? 'bg-surface-3 text-fg'
				: 'bg-surface-3/60 text-fg-muted hover:bg-surface-3 hover:text-fg'
		]}
	>
		{#if current?.icon}<Icon name={current.icon} size={12} class="shrink-0" />{/if}
		<span class="truncate">{text}</span>
		<Icon
			name="chevron"
			size={12}
			class={['shrink-0 text-fg-subtle transition-transform', open && 'rotate-180']}
		/>
	</button>
	{#if open}
		<div
			{@attach flip}
			role="menu"
			aria-label={label}
			class={[
				'absolute top-full left-0 z-30 mt-1.5 flex flex-col rounded-xl bg-surface p-1 shadow-float ring-1 ring-line',
				width
			]}
		>
			{#each options as option (option.value)}
				{@const selected = option.value === value}
				<button
					type="button"
					role="menuitemradio"
					aria-checked={selected}
					onclick={() => {
						onchange(option.value);
						open = false;
					}}
					class={[
						'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition',
						selected ? 'bg-accent/10 text-accent' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
					]}
				>
					{#if option.icon}<Icon name={option.icon} size={15} class="shrink-0" />{/if}
					<span class="flex min-w-0 flex-1 flex-col">
						{option.label}
						{#if option.description}
							<span class="text-[11px] text-fg-subtle">{option.description}</span>
						{/if}
					</span>
					{#if option.hint}
						<span class="shrink-0 text-[11px] text-fg-subtle tabular-nums">{option.hint}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
