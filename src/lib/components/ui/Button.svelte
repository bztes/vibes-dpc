<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		/** `danger` is subtle, `critical` is for confirming destructive actions */
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'critical';
		size?: 'sm' | 'md';
		icon?: IconName;
		/** Icon-only button: text used as aria-label */
		label?: string;
		children?: Snippet;
	}

	let {
		variant = 'secondary',
		size = 'md',
		icon,
		label,
		children,
		class: className,
		type = 'button',
		...rest
	}: Props = $props();
</script>

<button
	{type}
	aria-label={label}
	title={label}
	class={[
		'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
		'focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 focus-visible:outline-none',
		'disabled:pointer-events-none disabled:opacity-40',
		size === 'sm' ? 'h-7 text-xs' : 'h-9 text-sm',
		children ? (size === 'sm' ? 'px-2.5' : 'px-3.5') : size === 'sm' ? 'w-7' : 'w-9',
		variant === 'primary' && 'bg-stone-900 text-white hover:bg-stone-700',
		variant === 'secondary' && 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50',
		variant === 'ghost' && 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
		variant === 'danger' && 'text-stone-500 hover:bg-red-50 hover:text-critical-ink',
		variant === 'critical' && 'bg-critical text-white hover:bg-critical-ink',
		className
	]}
	{...rest}
>
	{#if icon}<Icon name={icon} size={size === 'sm' ? 14 : 16} />{/if}
	{@render children?.()}
</button>
