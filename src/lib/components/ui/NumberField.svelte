<script lang="ts">
	interface Props {
		value: number;
		label: string;
		unit?: string;
		min?: number;
		max?: number;
		step?: number | 'any';
		/** Visually hidden label */
		hideLabel?: boolean;
		class?: string;
	}

	let {
		value = $bindable(),
		label,
		unit,
		min,
		max,
		step = 'any',
		hideLabel = false,
		class: className
	}: Props = $props();

	const id = $props.id();

	// Only accept valid values so that empty inputs don't break the calculation
	function oninput(event: Event & { currentTarget: HTMLInputElement }) {
		const next = event.currentTarget.valueAsNumber;
		if (!Number.isFinite(next)) return;
		if (min !== undefined && next < min) return;
		if (max !== undefined && next > max) return;
		value = next;
	}
</script>

<div class={['flex flex-col gap-1', className]}>
	<label for={id} class={hideLabel ? 'sr-only' : 'text-xs font-medium text-stone-500'}
		>{label}</label
	>
	<div
		class="flex h-9 items-center rounded-lg border border-stone-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20"
	>
		<input
			{id}
			type="number"
			{value}
			{min}
			{max}
			{step}
			{oninput}
			class="h-full w-full min-w-0 [appearance:textfield] rounded-lg bg-transparent px-2.5 text-right text-sm tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
		/>
		{#if unit}<span class="pr-2.5 pl-1 text-xs whitespace-nowrap text-stone-500">{unit}</span>{/if}
	</div>
</div>
