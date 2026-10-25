<!-- Input bound to a field of a SvelteKit remote form -->
<script lang="ts">
	import type { RemoteFormField } from '$app/server';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'type' | 'name' | 'value'> {
		label: string;
		field: RemoteFormField<string>;
		type?: 'text' | 'email' | 'password';
	}

	let { label, field, type = 'text', ...rest }: Props = $props();

	const id = $props.id();
</script>

<div class="flex flex-col gap-1">
	<label for={id} class="text-xs font-medium text-stone-500">{label}</label>
	<input
		{id}
		{...field.as(type)}
		{...rest}
		class={[
			'h-10 rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2',
			field.issues()
				? 'border-critical focus:ring-critical/20'
				: 'border-stone-300 focus:border-sky-500 focus:ring-sky-500/20'
		]}
	/>
	{#each field.issues() ?? [] as issue (issue.message)}
		<p class="text-xs text-critical-ink">{issue.message}</p>
	{/each}
</div>
