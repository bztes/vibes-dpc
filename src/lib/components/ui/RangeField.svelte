<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';
	import { fmt } from '#lib/format.ts';

	interface Props {
		value: number;
		label: string;
		unit: string;
		min: number;
		max: number;
		step?: number;
		digits?: number;
		icon?: IconName;
		/** Slider accent colour */
		accent?: string;
		disabled?: boolean;
		/** Shown next to the label */
		extra?: Snippet;
		/** Replaces the slider */
		children?: Snippet;
	}

	let {
		value = $bindable(),
		label,
		unit,
		min,
		max,
		step = 1,
		digits = 0,
		icon,
		accent = 'var(--fg)',
		disabled = false,
		extra,
		children
	}: Props = $props();

	const id = $props.id();
</script>

<div class="flex flex-col">
	<div class="flex items-center gap-2">
		<label for={id} class="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
			{#if icon}<Icon name={icon} size={13} class="text-fg-subtle" />{/if}
			{label}
		</label>
		{@render extra?.()}
		<span class="flex-1"></span>
		<span class="text-sm font-semibold tabular-nums">
			{fmt(value, digits)}<span class="ml-0.5 text-xs font-normal text-fg-muted">{unit}</span>
		</span>
	</div>
	{#if children}
		{@render children()}
	{:else}
		<input
			{id}
			type="range"
			bind:value
			{min}
			{max}
			{step}
			{disabled}
			title="{fmt(min, 0)} – {fmt(max, 0)} {unit}"
			style:--range-accent={accent}
			style:--range-fill="{((value - min) / (max - min)) * 100}%"
			class="range w-full touch-pan-y disabled:cursor-default disabled:opacity-40"
		/>
	{/if}
</div>
