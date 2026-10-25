<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		value: string;
		unit?: string;
		hint?: Snippet | string;
	}

	let { label, value, unit, hint }: Props = $props();
</script>

<div class="rounded-xl bg-stone-50 px-4 py-3">
	<div class="text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</div>
	<div class="mt-1 flex items-baseline gap-1">
		<span class="text-2xl font-semibold text-stone-900 tabular-nums">{value}</span>
		{#if unit}<span class="text-sm text-stone-500">{unit}</span>{/if}
	</div>
	{#if hint}
		<div class="mt-1 text-xs text-stone-500">
			{#if typeof hint === 'string'}{hint}{:else}{@render hint()}{/if}
		</div>
	{/if}
</div>
