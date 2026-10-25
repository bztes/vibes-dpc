<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		value: string;
		label: string;
		hideLabel?: boolean;
		error?: string;
	}

	let {
		value = $bindable(),
		label,
		hideLabel = false,
		error,
		class: className,
		...rest
	}: Props = $props();

	const id = $props.id();
</script>

<div class={['flex flex-col gap-1', className]}>
	<label for={id} class={hideLabel ? 'sr-only' : 'text-xs font-medium text-stone-500'}
		>{label}</label
	>
	<input
		{id}
		bind:value
		aria-invalid={!!error}
		class={[
			'h-9 rounded-lg border bg-white px-2.5 text-sm outline-none focus:ring-2',
			error
				? 'border-critical focus:ring-critical/20'
				: 'border-stone-300 focus:border-sky-500 focus:ring-sky-500/20'
		]}
		{...rest}
	/>
	{#if error}<p class="text-xs text-critical-ink">{error}</p>{/if}
</div>
