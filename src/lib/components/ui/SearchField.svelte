<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		value: string;
		placeholder?: string;
		class?: string;
	}

	let { value = $bindable(), placeholder = 'Search …', class: className }: Props = $props();
</script>

<label
	class={[
		'flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 sm:h-9',
		className
	]}
>
	<Icon name="search" size={15} class="text-fg-subtle" />
	<span class="sr-only">Search</span>
	<input
		type="search"
		bind:value
		{placeholder}
		class="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-fg-subtle sm:text-sm [&::-webkit-search-cancel-button]:hidden"
	/>
	{#if value}
		<button
			type="button"
			aria-label="Clear search"
			onclick={() => (value = '')}
			class="-mr-1 rounded p-0.5 text-fg-subtle hover:text-fg"
		>
			<Icon name="close" size={14} />
		</button>
	{/if}
</label>
