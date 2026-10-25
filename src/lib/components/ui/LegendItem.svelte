<script lang="ts">
	interface Props {
		label: string;
		color: string;
		kind?: 'line' | 'dashed' | 'area' | 'hatch' | 'dot';
	}

	let { label, color, kind = 'line' }: Props = $props();
</script>

<span class="inline-flex items-center gap-1.5 text-xs text-stone-600">
	<svg width="18" height="10" aria-hidden="true">
		{#if kind === 'line'}
			<line x1="1" x2="17" y1="5" y2="5" stroke={color} stroke-width="2" stroke-linecap="round" />
		{:else if kind === 'dashed'}
			<line x1="1" x2="17" y1="5" y2="5" stroke={color} stroke-width="2" stroke-dasharray="3 2.5" />
		{:else if kind === 'area'}
			<rect x="1" y="1" width="16" height="8" rx="2" fill={color} fill-opacity="0.3" />
		{:else if kind === 'hatch'}
			<rect x="1" y="1" width="16" height="8" rx="2" fill={color} fill-opacity="0.18" />
			<path d="M4 9 9 1M10 9 15 1" stroke={color} stroke-width="1.5" />
		{:else}
			<circle cx="9" cy="5" r="4" fill={color} />
		{/if}
	</svg>
	{label}
</span>
