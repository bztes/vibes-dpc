<!-- Centred card for the sign-in and sign-up pages -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppIcon from '#lib/components/AppIcon.svelte';
	import { templatePath } from '#lib/wall.svelte.ts';

	interface Props {
		title: string;
		subtitle: string;
		children: Snippet;
		footer?: Snippet;
	}

	let { title, subtitle, children, footer }: Props = $props();
</script>

<main
	class="relative grid min-h-dvh place-items-center overflow-hidden px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]"
>
	<!-- Warm and cold glow, like the zones of the chart -->
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
		<div class="absolute -top-40 -left-32 size-[32rem] rounded-full bg-temp/15 blur-3xl"></div>
		<div class="absolute -right-32 -bottom-40 size-[32rem] rounded-full bg-dew/15 blur-3xl"></div>
	</div>

	<div class="flex w-full max-w-sm flex-col items-center gap-6">
		<a
			href={templatePath()}
			class="flex items-center gap-2.5 rounded-xl px-1.5 py-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
		>
			<AppIcon class="size-9" />
			<span class="text-base font-semibold tracking-tight">Dew Point</span>
		</a>

		<div class="w-full rounded-2xl bg-surface p-6 shadow-float ring-1 ring-line sm:p-7">
			<h1 class="text-lg font-semibold tracking-tight">{title}</h1>
			<p class="mt-1 text-sm text-pretty text-fg-muted">{subtitle}</p>
			<div class="mt-6">{@render children()}</div>
		</div>

		{#if footer}<p class="text-sm text-fg-muted">{@render footer()}</p>{/if}
	</div>
</main>
