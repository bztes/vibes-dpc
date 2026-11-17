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
	<label for={id} class="text-xs font-medium text-fg-muted">{label}</label>
	<input
		{id}
		{...field.as(type)}
		{...rest}
		class={[
			'h-11 rounded-lg border bg-surface px-3.5 text-base outline-none focus:ring-4 sm:text-sm',
			field.issues()
				? 'border-critical focus:ring-critical/15'
				: 'border-line-strong focus:border-accent focus:ring-accent/15'
		]}
	/>
	{#each field.issues() ?? [] as issue (issue.message)}
		<p class="text-xs text-critical-ink">{issue.message}</p>
	{/each}
</div>
