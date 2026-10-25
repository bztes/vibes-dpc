<!-- SVG fill patterns for the material categories. Must be used inside an <svg>. -->
<script lang="ts">
	import { categoryStyles } from '#lib/layer-style.ts';
	import type { MaterialCategory } from '#lib/physics/types.ts';

	interface Props {
		/** Prefix for unique ids per chart */
		prefix: string;
	}

	let { prefix }: Props = $props();

	const entries = Object.entries(categoryStyles) as [
		MaterialCategory,
		(typeof categoryStyles)[MaterialCategory]
	][];
</script>

<defs>
	{#each entries as [category, style] (category)}
		<pattern id="{prefix}-{category}" patternUnits="userSpaceOnUse" width="16" height="16">
			<rect width="16" height="16" fill={style.fill} />
			{#if style.pattern === 'dots'}
				<circle cx="4" cy="4" r="0.9" fill={style.ink} />
				<circle cx="12" cy="12" r="0.9" fill={style.ink} />
			{:else if style.pattern === 'wave'}
				<path d="M0 8 Q4 0 8 8 T16 8" fill="none" stroke={style.ink} stroke-width="1" />
			{:else if style.pattern === 'grain'}
				<path
					d="M0 4 Q8 2 16 4 M0 12 Q8 14 16 12"
					fill="none"
					stroke={style.ink}
					stroke-width="0.8"
				/>
			{:else if style.pattern === 'brick'}
				<path
					d="M0 0.5H16M0 8.5H16M4 0.5V8.5M12 8.5V16"
					fill="none"
					stroke={style.ink}
					stroke-width="1"
				/>
			{:else if style.pattern === 'hatch'}
				<path d="M0 16 16 0M-4 4 4-4M12 20 20 12" stroke={style.ink} stroke-width="0.8" />
				<circle cx="10" cy="5" r="1" fill={style.ink} />
			{:else if style.pattern === 'vertical'}
				<path d="M4 0V16M12 0V16" stroke={style.ink} stroke-width="0.8" />
			{/if}
		</pattern>
	{/each}
	<pattern
		id="{prefix}-condensation"
		patternUnits="userSpaceOnUse"
		width="8"
		height="8"
		patternTransform="rotate(45)"
	>
		<rect width="8" height="8" fill="#d03b3b" fill-opacity="0.18" />
		<path d="M0 0V8" stroke="#d03b3b" stroke-width="2.5" stroke-opacity="0.75" />
	</pattern>
</defs>
