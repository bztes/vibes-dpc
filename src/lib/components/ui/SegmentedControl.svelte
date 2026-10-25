<script lang="ts" generics="T extends string">
	interface Props {
		value: T;
		options: { value: T; label: string }[];
		label: string;
	}

	let { value = $bindable(), options, label }: Props = $props();
</script>

<div
	role="radiogroup"
	aria-label={label}
	class="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium"
>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			onclick={() => (value = option.value)}
			class={[
				'rounded-md px-2.5 py-1 transition-colors',
				value === option.value
					? 'bg-white text-stone-900 shadow-sm'
					: 'text-stone-500 hover:text-stone-800'
			]}
		>
			{option.label}
		</button>
	{/each}
</div>
