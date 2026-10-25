<script lang="ts" module>
	export type Tone = 'good' | 'warning' | 'critical' | 'neutral' | 'info';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props {
		tone?: Tone;
		icon?: IconName;
		children: Snippet;
	}

	let { tone = 'neutral', icon, children }: Props = $props();
</script>

<span
	class={[
		'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
		tone === 'good' && 'bg-green-50 text-good-ink ring-1 ring-good/30',
		tone === 'warning' && 'bg-amber-50 text-warning-ink ring-1 ring-warning/50',
		tone === 'critical' && 'bg-red-50 text-critical-ink ring-1 ring-critical/30',
		tone === 'info' && 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
		tone === 'neutral' && 'bg-stone-100 text-stone-600 ring-1 ring-stone-200'
	]}
>
	{#if icon}<Icon name={icon} size={12} />{/if}
	{@render children()}
</span>
