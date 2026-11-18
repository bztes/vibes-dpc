<!-- Errors of a remote form that don't belong to a single field -->
<script lang="ts">
	import Icon from '#lib/components/ui/Icon.svelte';

	interface Props {
		issues: { message: string; path?: unknown[] }[] | undefined;
	}

	let { issues }: Props = $props();

	let general = $derived(issues?.filter((issue) => !issue.path?.length) ?? []);
</script>

{#each general as issue (issue.message)}
	<p
		class="flex items-center gap-2 rounded-lg bg-critical/10 px-3 py-2 text-sm text-critical-ink"
		role="alert"
	>
		<Icon name="alert" size={15} />
		{issue.message}
	</p>
{/each}
