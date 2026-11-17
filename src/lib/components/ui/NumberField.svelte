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
		/** Smaller field for dense lists */
		compact?: boolean;
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
		compact = false,
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
	<label for={id} class={hideLabel ? 'sr-only' : 'text-xs font-medium text-fg-muted'}>{label}</label
	>
	<div
		class={[
			'flex items-center border border-line-strong bg-surface transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15',
			compact ? 'h-9 rounded-lg sm:h-8' : 'h-10 rounded-lg sm:h-9'
		]}
	>
		<input
			{id}
			type="number"
			{value}
			{min}
			{max}
			{step}
			{oninput}
			class="h-full w-full min-w-0 [appearance:textfield] rounded-lg bg-transparent px-2 text-right text-base tabular-nums outline-none sm:text-sm [&::-webkit-inner-spin-button]:appearance-none"
		/>
		{#if unit}<span class="pr-2 pl-0.5 text-xs whitespace-nowrap text-fg-subtle">{unit}</span>{/if}
	</div>
</div>
