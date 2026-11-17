<script lang="ts" generics="T extends string">
	import Icon, { type IconName } from './Icon.svelte';

	interface Props {
		value: T;
		options: { value: T; label: string; icon?: IconName; title?: string }[];
		label: string;
		/** Stretch across the available width */
		fill?: boolean;
		size?: 'sm' | 'md';
		onchange?: (value: T) => void;
	}

	let {
		value = $bindable(),
		options,
		label,
		fill = false,
		size = 'sm',
		onchange
	}: Props = $props();
</script>

<div
	role="radiogroup"
	aria-label={label}
	class={[
		'gap-0.5 rounded-lg bg-surface-3/70 p-0.5 font-medium',
		size === 'sm' ? 'text-xs' : 'text-sm',
		fill ? 'flex w-full' : 'inline-flex'
	]}
>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			title={option.title}
			onclick={() => {
				value = option.value;
				onchange?.(option.value);
			}}
			class={[
				'inline-flex items-center justify-center gap-1.5 rounded-md whitespace-nowrap transition',
				size === 'sm' ? 'h-8 sm:h-7' : 'h-9',
				fill ? 'min-w-0 flex-1 px-1.5' : 'px-3',
				value === option.value
					? 'bg-surface text-fg shadow-sm ring-1 ring-line'
					: 'text-fg-muted hover:text-fg'
			]}
		>
			{#if option.icon}<Icon name={option.icon} size={14} />{/if}
			{option.label}
		</button>
	{/each}
</div>
