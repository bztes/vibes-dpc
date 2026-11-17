<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		/** `danger` is subtle, `critical` is for confirming destructive actions */
		variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'critical';
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
		'inline-flex shrink-0 items-center justify-center gap-1.5 font-medium whitespace-nowrap transition select-none active:scale-[0.97]',
		'focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
		'disabled:pointer-events-none disabled:opacity-40',
		// Larger touch targets on small screens
		size === 'sm' ? 'h-8 rounded-md text-xs sm:h-7' : 'h-10 rounded-lg text-sm sm:h-9',
		children ? (size === 'sm' ? 'px-2.5' : 'px-3.5') : size === 'sm' ? 'w-8 sm:w-7' : 'w-10 sm:w-9',
		variant === 'primary' && 'bg-inverse text-inverse-fg hover:opacity-90',
		variant === 'accent' && 'bg-accent text-white shadow-sm shadow-accent/30 hover:brightness-110',
		variant === 'secondary' && 'bg-surface text-fg ring-1 ring-line-strong hover:bg-surface-2',
		variant === 'ghost' && 'text-fg-muted hover:bg-surface-3 hover:text-fg',
		variant === 'danger' && 'text-fg-muted hover:bg-critical/10 hover:text-critical-ink',
		variant === 'critical' && 'bg-critical text-white hover:brightness-110',
		className
	]}
	{...rest}
>
	{#if icon}<Icon name={icon} size={size === 'sm' ? 14 : 16} />{/if}
	{@render children?.()}
</button>
