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
	<label for={id} class={hideLabel ? 'sr-only' : 'text-xs font-medium text-fg-muted'}>{label}</label
	>
	<input
		{id}
		bind:value
		aria-invalid={!!error}
		class={[
			'h-10 rounded-lg border bg-surface px-3 text-base outline-none focus:ring-4 sm:h-9 sm:text-sm',
			error
				? 'border-critical focus:ring-critical/15'
				: 'border-line-strong focus:border-accent focus:ring-accent/15'
		]}
		{...rest}
	/>
	{#if error}<p class="text-xs text-critical-ink">{error}</p>{/if}
</div>
