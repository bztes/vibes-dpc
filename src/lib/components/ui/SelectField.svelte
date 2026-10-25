<script lang="ts" module>
	export interface SelectOption {
		value: string;
		label: string;
		group?: string;
	}
</script>

<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		value?: string;
		options: SelectOption[];
		label: string;
		placeholder?: string;
		hideLabel?: boolean;
		onchange?: (value: string) => void;
		class?: string;
	}

	let {
		value = $bindable(''),
		options,
		label,
		placeholder,
		hideLabel = false,
		onchange,
		class: className
	}: Props = $props();

	const id = $props.id();

	let groups = $derived.by(() => {
		const result: [string, SelectOption[]][] = [];
		for (const option of options) {
			const key = option.group ?? '';
			const group = result.find(([name]) => name === key);
			if (group) group[1].push(option);
			else result.push([key, [option]]);
		}
		return result;
	});
</script>

<div class={['flex flex-col gap-1', className]}>
	<label for={id} class={hideLabel ? 'sr-only' : 'text-xs font-medium text-stone-500'}
		>{label}</label
	>
	<div class="relative">
		<select
			{id}
			bind:value
			onchange={() => onchange?.(value)}
			class="h-9 w-full cursor-pointer appearance-none truncate rounded-lg border border-stone-300 bg-white pr-8 pl-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
		>
			{#if placeholder}<option value="" disabled>{placeholder}</option>{/if}
			{#each groups as [group, items] (group)}
				{#if group}
					<optgroup label={group}>
						{#each items as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</optgroup>
				{:else}
					{#each items as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				{/if}
			{/each}
		</select>
		<span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-stone-400">
			<Icon name="chevron" size={14} />
		</span>
	</div>
</div>
