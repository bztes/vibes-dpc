<!-- Description and tags of the build-up; editable for the user's own build-ups -->
<script lang="ts">
	import Badge from '#lib/components/ui/Badge.svelte';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import { getWall } from '#lib/wall.svelte.ts';

	const wall = getWall();

	let own = $derived(!!wall.template?.config);
</script>

<div class="flex flex-col gap-2">
	{#if own}
		<textarea
			aria-label="Description"
			placeholder="Add a description …"
			maxlength={500}
			rows={1}
			class="-mx-1.5 field-sizing-content resize-none rounded-lg bg-transparent px-1.5 py-1 text-sm text-fg-muted outline-none placeholder:text-fg-subtle hover:bg-surface-3/60 focus:bg-surface focus:ring-2 focus:ring-accent/40"
			value={wall.template!.description}
			onkeydown={(event) => {
				if (event.key === 'Enter' && !event.shiftKey) {
					event.preventDefault();
					event.currentTarget.blur();
				}
			}}
			onchange={(event) =>
				wall.updateConfigDetails(wall.templateId, {
					description: event.currentTarget.value.trim()
				})}></textarea>
		<TagInput
			label="Tags"
			hideLabel
			variant="subtle"
			placeholder="Add a tag, e.g. Sweden …"
			bind:tags={
				() => wall.template!.keywords,
				(keywords) => wall.updateConfigDetails(wall.templateId, { keywords })
			}
		/>
	{:else}
		{#if wall.template?.description}
			<p class="text-sm text-pretty text-fg-muted">{wall.template.description}</p>
		{/if}
		{#if wall.template?.keywords.length}
			<ul class="flex flex-wrap gap-1" aria-label="Tags">
				{#each wall.template.keywords as keyword (keyword)}
					<li><Badge icon="tag">{keyword}</Badge></li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
