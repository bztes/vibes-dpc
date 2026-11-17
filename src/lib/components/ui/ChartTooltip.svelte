<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Horizontal position in percent of the container width */
		x: number;
		/** Vertical position in percent of the container height */
		y?: number;
		title?: string;
		children: Snippet;
	}

	let { x, y = 8, title, children }: Props = $props();
</script>

<div
	role="status"
	class="pointer-events-none absolute z-10 min-w-44 rounded-xl bg-surface/95 px-3 py-2 text-xs shadow-float ring-1 ring-line backdrop-blur"
	style:left="{x}%"
	style:top="{y}%"
	style:transform={x > 60 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)'}
>
	{#if title}<div class="mb-1 font-semibold text-fg">{title}</div>{/if}
	<div class="flex flex-col gap-0.5 text-fg-muted">
		{@render children()}
	</div>
</div>
