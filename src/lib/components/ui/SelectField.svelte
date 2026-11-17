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
	<label for={id} class={hideLabel ? 'sr-only' : 'text-xs font-medium text-fg-muted'}>{label}</label
	>
	<div class="relative">
		<select
			{id}
			bind:value
			onchange={() => onchange?.(value)}
			class="h-10 w-full cursor-pointer appearance-none truncate rounded-lg border border-line-strong bg-surface pr-8 pl-3 text-base transition outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 sm:h-9 sm:text-sm"
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
		<span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-subtle">
			<Icon name="chevron" size={14} />
		</span>
	</div>
</div>
