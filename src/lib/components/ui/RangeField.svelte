<script lang="ts">
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
		accent = '#1c1917',
		disabled = false
	}: Props = $props();

	const id = $props.id();
</script>

<div class="flex flex-col gap-1.5">
	<div class="flex items-center justify-between gap-2">
		<label for={id} class="flex items-center gap-1.5 text-sm font-medium text-stone-700">
			{#if icon}<span class="text-stone-400"><Icon name={icon} size={14} /></span>{/if}
			{label}
		</label>
		<span class="text-sm font-semibold text-stone-900 tabular-nums"
			>{fmt(value, digits)} {unit}</span
		>
	</div>
	<input
		{id}
		type="range"
		bind:value
		{min}
		{max}
		{step}
		{disabled}
		style:accent-color={accent}
		class="h-1.5 w-full cursor-pointer disabled:cursor-default disabled:opacity-50"
	/>
	<div class="flex justify-between text-[11px] text-stone-400 tabular-nums">
		<span>{fmt(min, 0)} {unit}</span>
		<span>{fmt(max, 0)} {unit}</span>
	</div>
</div>
