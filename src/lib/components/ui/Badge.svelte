<script lang="ts" module>
	export type Tone = 'good' | 'warning' | 'critical' | 'neutral' | 'info';

	export const toneClasses: Record<Tone, string> = {
		good: 'bg-good/12 text-good-ink',
		warning: 'bg-warning/15 text-warning-ink',
		critical: 'bg-critical/12 text-critical-ink',
		info: 'bg-accent/12 text-accent',
		neutral: 'bg-surface-3 text-fg-muted'
	};
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
		'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
		toneClasses[tone]
	]}
>
	{#if icon}<Icon name={icon} size={11} />{/if}
	{@render children()}
</span>
