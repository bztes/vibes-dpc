<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { deleteAssembly, getCatalog, saveAssembly } from '#lib/catalog.remote.ts';
	import PageHeader from '#lib/components/admin/PageHeader.svelte';
	import LayerStrip from '#lib/components/LayerStrip.svelte';
	import ActionMenu from '#lib/components/ui/ActionMenu.svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import SearchField from '#lib/components/ui/SearchField.svelte';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { errorMessage } from '#lib/errors.ts';
	import { searchMatcher } from '#lib/format.ts';
	import type { Assembly } from '#lib/physics/types.ts';

	let catalog = $derived(await getCatalog());

	let search = $state('');
	let matcher = $derived(searchMatcher(search));
	let templates = $derived(
		catalog.assemblies.filter((t) => matcher(`${t.name} ${t.description} ${t.keywords.join(' ')}`))
	);

	const thickness = (template: Assembly) =>
		Math.round(template.layers.filter((l) => !l.disabled).reduce((sum, l) => sum + l.thickness, 0));

	const editorPath = (template: Assembly) => resolve('/(calculator)/[[id]]', { id: template.id });

	let busy = $state(false);
	let error = $state('');

	async function run(action: () => Promise<unknown>) {
		busy = true;
		error = '';
		try {
			await action();
			return true;
		} catch (e) {
			error = errorMessage(e, 'Saving failed');
			return false;
		} finally {
			busy = false;
		}
	}

	// ─── Edit details ───
	let editDialog = $state<Dialog>();
	let editing = $state<Assembly>();
	let draft = $state({ name: '', description: '', keywords: [] as string[] });

	function edit(template: Assembly) {
		editing = template;
		draft = {
			name: template.name,
			description: template.description,
			keywords: [...template.keywords]
		};
		error = '';
		editDialog?.open();
	}

	// ─── Delete ───
	let deleteDialog = $state<Dialog>();
	let deleteTarget = $state<Assembly>();
</script>

<PageHeader
	title="Templates"
	description="Build-ups everyone can start from. To change the layers, open a template in the calculator, edit it and choose “Update template”."
>
	{#snippet actions()}
		<a
			href={resolve('/(calculator)/[[id]]', {})}
			class="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-white shadow-sm shadow-accent/30 transition hover:brightness-110 sm:h-9"
		>
			<Icon name="plus" size={16} /> New in calculator
		</a>
	{/snippet}
</PageHeader>

<SearchField bind:value={search} placeholder="Search templates …" class="w-full sm:w-80" />

{#if error}<p class="text-sm text-critical-ink" role="alert">{error}</p>{/if}

{#if templates.length}
	<ul class="grid gap-3 md:grid-cols-2">
		{#each templates as template (template.id)}
			<li
				class="group flex flex-col gap-4 rounded-xl bg-surface p-5 ring-1 ring-line transition hover:shadow-panel hover:ring-line-strong"
			>
				<div class="flex items-start gap-3">
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<h2 class="truncate font-semibold tracking-tight">{template.name}</h2>
							{#if template.builtIn}<Badge>Example</Badge>{/if}
						</div>
						<p class="mt-1 line-clamp-2 text-sm text-pretty text-fg-muted">
							{template.description || 'No description'}
						</p>
					</div>
					<ActionMenu
						label="Actions for {template.name}"
						disabled={busy}
						actions={[
							{ icon: 'edit', label: 'Edit details', onclick: () => edit(template) },
							{
								icon: 'layers',
								label: 'Edit layers',
								onclick: () => goto(editorPath(template))
							},
							null,
							{
								icon: 'trash',
								label: 'Delete',
								danger: true,
								onclick: () => {
									deleteTarget = template;
									error = '';
									deleteDialog?.open();
								}
							}
						]}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<LayerStrip layers={template.layers} class="h-2.5!" />
					<div class="flex items-center justify-between text-xs text-fg-subtle tabular-nums">
						<span>{template.layers.length} {template.layers.length === 1 ? 'layer' : 'layers'}</span
						>
						<span>{thickness(template)} mm</span>
					</div>
				</div>

				{#if template.keywords.length}
					<div class="mt-auto flex flex-wrap gap-1">
						{#each template.keywords as keyword (keyword)}
							<Badge icon="tag">{keyword}</Badge>
						{/each}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{:else}
	<div
		class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center"
	>
		<p class="text-sm font-medium">
			{catalog.assemblies.length ? 'No templates match your search' : 'No templates yet'}
		</p>
		{#if !catalog.assemblies.length}
			<p class="text-sm text-fg-muted">
				Build a wall in the calculator and choose “Save as new template”.
			</p>
		{/if}
	</div>
{/if}

<Dialog
	bind:this={editDialog}
	onclose={() => (error = '')}
	title="Edit template"
	icon="edit"
	size="lg"
>
	<form
		id="edit-template"
		class="flex flex-col gap-3"
		onsubmit={async (event) => {
			event.preventDefault();
			const template = editing!;
			const saved = await run(() =>
				saveAssembly({ id: template.id, ...$state.snapshot(draft), layers: template.layers })
			);
			if (saved) editDialog?.close();
		}}
	>
		<TextField label="Name" required maxlength={120} bind:value={draft.name} />
		<TextField label="Description" maxlength={500} bind:value={draft.description} />
		<TagInput label="Tags" placeholder="Sweden, Germany …" bind:tags={draft.keywords} />
		{#if error}<p class="text-sm text-critical-ink">{error}</p>{/if}
	</form>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => editDialog?.close()}>Cancel</Button>
		<Button
			type="submit"
			form="edit-template"
			variant="accent"
			disabled={busy || !draft.name.trim()}
		>
			Save
		</Button>
	{/snippet}
</Dialog>

<Dialog
	bind:this={deleteDialog}
	onclose={() => (error = '')}
	size="sm"
	tone="critical"
	icon="trash"
	title="Delete “{deleteTarget?.name}”?"
	subtitle="The template is removed for everyone. Build-ups saved in browsers are not affected."
>
	{#if error}<p class="text-sm text-critical-ink">{error}</p>{/if}
	{#snippet actions()}
		<Button variant="ghost" onclick={() => deleteDialog?.close()}>Cancel</Button>
		<Button
			variant="critical"
			icon="trash"
			disabled={busy}
			onclick={async () => {
				if (await run(() => deleteAssembly(deleteTarget!.id))) deleteDialog?.close();
			}}
		>
			Delete
		</Button>
	{/snippet}
</Dialog>
