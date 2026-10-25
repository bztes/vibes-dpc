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
	}

	let { title, subtitle, icon, actions, children, class: className }: Props = $props();
</script>

<section class={['rounded-2xl border border-stone-200 bg-white shadow-sm', className]}>
	{#if title || actions}
		<header
			class="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-4"
		>
			<div class="flex items-start gap-2.5">
				{#if icon}
					<span class="mt-0.5 text-stone-400"><Icon name={icon} size={18} /></span>
				{/if}
				<div>
					{#if title}<h2 class="text-base font-semibold text-stone-900">{title}</h2>{/if}
					{#if subtitle}<p class="mt-0.5 text-sm text-stone-500">{subtitle}</p>{/if}
				</div>
			</div>
			{#if actions}<div class="flex items-center gap-2">{@render actions()}</div>{/if}
		</header>
	{/if}
	<div class="p-5">
		{@render children()}
	</div>
</section>
