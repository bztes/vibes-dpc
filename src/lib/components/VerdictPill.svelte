<!-- Compact live status of the build-up -->
<script lang="ts">
	import { toneClasses } from '#lib/components/ui/Badge.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { verdictStyles } from '#lib/verdict.ts';
	import { getWall } from '#lib/wall.svelte.ts';

	let { class: className, onclick }: { class?: string; onclick?: () => void } = $props();

	const wall = getWall();
	let verdict = $derived(wall.verdict);
</script>

{#if wall.activeLayers.length}
	<svelte:element
		this={onclick ? 'button' : 'span'}
		type={onclick ? 'button' : undefined}
		role={onclick ? undefined : 'status'}
		{onclick}
		class={[
			'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full pr-2.5 pl-1 text-xs font-semibold whitespace-nowrap',
			toneClasses[verdict.tone],
			className
		]}
	>
		<span
			class={['grid size-5 place-items-center rounded-full', verdictStyles[verdict.tone].solid]}
		>
			<Icon name={verdict.icon} size={12} strokeWidth={2.5} />
		</span>
		{verdict.title}
	</svelte:element>
{/if}
