<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		icon?: IconName;
		actions?: Snippet;
		children: Snippet;
		class?: string;
		id?: string;
	}

	let { title, subtitle, icon, actions, children, class: className, id }: Props = $props();
</script>

<section {id} class={['rounded-xl bg-surface ring-1 ring-line', className]}>
	{#if title || actions}
		<header
			class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5"
		>
			<div class="flex min-w-0 items-center gap-2.5">
				{#if icon}<Icon name={icon} size={16} class="text-fg-subtle" />{/if}
				<div class="min-w-0">
					{#if title}<h2 class="text-sm font-semibold">{title}</h2>{/if}
					{#if subtitle}<p class="text-xs text-pretty text-fg-muted">{subtitle}</p>{/if}
				</div>
			</div>
			{#if actions}<div class="flex items-center gap-2">{@render actions()}</div>{/if}
		</header>
	{/if}
	<div class="p-4 sm:p-5">
		{@render children()}
	</div>
</section>
