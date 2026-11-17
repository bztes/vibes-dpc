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

<div class="flex flex-col px-4 py-3">
	<div class="text-[11px] font-medium text-fg-muted">{label}</div>
	<div class="mt-0.5 flex items-baseline gap-1">
		<span class="text-xl font-semibold tracking-tight tabular-nums">{value}</span>
		{#if unit}<span class="text-xs text-fg-muted">{unit}</span>{/if}
	</div>
	{#if hint}
		<div class="mt-0.5 text-[11px] text-pretty text-fg-subtle">
			{#if typeof hint === 'string'}{hint}{:else}{@render hint()}{/if}
		</div>
	{/if}
</div>
