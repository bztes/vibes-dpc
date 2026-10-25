<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { deleteAssembly, saveAssembly } from '#lib/catalog.remote.ts';
	import LayerStrip from '#lib/components/LayerStrip.svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import TagInput from '#lib/components/ui/TagInput.svelte';
	import { fmt } from '#lib/format.ts';
	import { getWall } from '#lib/wall.svelte.ts';

	interface Props {
		/** Admins can also save and delete shared templates */
		admin: boolean;
	}

	let { admin }: Props = $props();

	const wall = getWall();

	/** The build-up is one of the user's configs */
	let own = $derived(!!wall.template?.config);
	/** The loaded build-up can be overwritten or deleted */
	let editable = $derived(own || (!!wall.template && admin));
	let thickness = $derived(wall.activeLayers.reduce((sum, layer) => sum + layer.thickness, 0));

	let menuOpen = $state(false);
	let menu = $state<HTMLElement>();

	let busy = $state(false);
	let error = $state('');

	async function run(action: () => Promise<void>) {
		menuOpen = false;
		busy = true;
		error = '';
		try {
			await action();
		} catch (e) {
			error = (e as { body?: { message?: string } }).body?.message ?? 'Saving failed';
		} finally {
			busy = false;
		}
	}

	/** Shows the build-up with `id` in the URL; it is already loaded, so nothing reloads */
	function show(id: string) {
		wall.templateId = id;
		return goto(resolve('/calculator/[[id]]', { id }), { replace: true, shallow: true });
	}

	// Saves straight away; name, description and tags can be edited in place afterwards
	function saveAsNew() {
		menuOpen = false;
		const template = wall.template;
		void show(
			wall.saveConfig({
				name: template ? `${template.name} (copy)` : 'My build-up',
				description: template?.description ?? '',
				keywords: template?.keywords ?? []
			})
		);
	}

	const update = () =>
		run(async () => {
			const template = wall.template!;
			if (template.config) {
				wall.saveConfig(template);
				return;
			}
			await saveAssembly({
				id: template.id,
				name: template.name,
				description: template.description,
				keywords: template.keywords,
				layers: wall.snapshot()
			});
		});

	// Admins: stores the current build-up as a new shared template and switches to it
	const saveAsTemplate = () =>
		run(async () => {
			const template = wall.template;
			const { id } = await saveAssembly({
				name: `${template?.name ?? 'Build-up'} (copy)`,
				description: template?.description ?? '',
				keywords: template?.keywords ?? [],
				layers: wall.snapshot()
			});
			await show(id);
		});

	let deleteDialog = $state<HTMLDialogElement>();

	function confirmDelete() {
		menuOpen = false;
		deleteDialog?.showModal();
	}

	const remove = () =>
		run(async () => {
			const template = wall.template!;
			if (template.config) wall.deleteConfig(template.id);
			else await deleteAssembly(template.id);
			deleteDialog?.close();
			await goto(resolve('/'));
		});

	/** Blurs on Enter so that the field is stored */
	const commitOnEnter = (event: KeyboardEvent & { currentTarget: HTMLElement }) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			event.currentTarget.blur();
		}
	};

	/** Inputs that look like plain text until hovered or focused */
	const inline =
		'-mx-2 w-[calc(100%+1rem)] min-w-0 rounded-lg bg-transparent px-2 outline-none transition hover:bg-stone-100/70 focus:bg-white focus:ring-2 focus:ring-sky-500/30 placeholder:text-stone-400';
</script>

<svelte:window
	onclick={(event) => {
		if (menuOpen && !menu?.contains(event.target as Node)) menuOpen = false;
	}}
	onkeydown={(event) => {
		if (event.key === 'Escape') menuOpen = false;
	}}
/>

{#snippet item(
	icon: IconName,
	label: string,
	onclick: () => void,
	disabled = false,
	danger = false
)}
	<button
		type="button"
		role="menuitem"
		{disabled}
		{onclick}
		class={[
			'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm disabled:opacity-40',
			danger
				? 'text-stone-600 hover:bg-red-50 hover:text-critical-ink'
				: 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
		]}
	>
		<Icon name={icon} size={15} />
		{label}
	</button>
{/snippet}

<section
	class="relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
	aria-labelledby="build-up-title"
>
	<!-- Soft dew-coloured glow in the corner -->
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_20rem_at_100%_0%,rgb(42_120_214/0.10),transparent_60%),radial-gradient(30rem_16rem_at_0%_100%,rgb(235_104_52/0.06),transparent_60%)]"
	></div>

	<div class="relative flex flex-col gap-5 p-5 sm:p-7">
		<div class="flex flex-wrap items-start gap-4">
			<span
				class="hidden size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-sky-400 to-dew text-white shadow-lg shadow-sky-600/20 sm:grid"
			>
				<Icon name={own ? 'save' : wall.template ? 'home' : 'layers'} size={22} />
			</span>

			<div class="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-xs font-semibold tracking-wider text-sky-700 uppercase">
						{own ? 'My build-up' : wall.template ? 'Template' : 'New build-up'}
					</span>
					{#if wall.template && wall.modified}
						<Badge tone="warning">Unsaved changes</Badge>
					{/if}
				</div>

				{#if own}
					<!-- Edited in place; each field is stored when it loses focus -->
					<input
						id="build-up-title"
						aria-label="Name"
						maxlength={120}
						class={[
							inline,
							'h-10 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl'
						]}
						value={wall.template!.name}
						onkeydown={commitOnEnter}
						onchange={(event) => {
							const name = event.currentTarget.value.trim();
							if (name) wall.updateConfigDetails(wall.templateId, { name });
							else event.currentTarget.value = wall.template!.name;
						}}
					/>
					<textarea
						aria-label="Description"
						placeholder="Add a description …"
						maxlength={500}
						rows={1}
						class={[inline, 'field-sizing-content resize-none py-0.5 text-stone-600']}
						value={wall.template!.description}
						onkeydown={commitOnEnter}
						onchange={(event) =>
							wall.updateConfigDetails(wall.templateId, {
								description: event.currentTarget.value.trim()
							})}></textarea>
				{:else}
					<h1
						id="build-up-title"
						class="text-2xl font-semibold tracking-tight text-balance text-stone-900 sm:text-3xl"
					>
						{wall.template?.name ?? 'Custom build-up'}
					</h1>
					<p class="max-w-3xl text-pretty text-stone-600">
						{wall.template?.description ||
							(wall.template
								? ''
								: 'Add layers from inside to outside, then save the build-up to keep it in this browser.')}
					</p>
				{/if}
			</div>

			<div class="flex items-center gap-1.5">
				{#if wall.template && wall.modified}
					<Button
						variant="ghost"
						icon="reset"
						label="Discard changes"
						onclick={() => wall.loadTemplate(wall.templateId)}
					/>
				{/if}
				<Button
					variant="primary"
					icon="save"
					disabled={busy || wall.layers.length === 0 || (own && !wall.modified)}
					onclick={own ? update : saveAsNew}
				>
					{own ? 'Save' : 'Save as mine'}
				</Button>
				{#if own || admin}
					<div class="relative" bind:this={menu}>
						<Button
							icon="more"
							label="More actions"
							disabled={busy}
							aria-haspopup="menu"
							aria-expanded={menuOpen}
							onclick={() => (menuOpen = !menuOpen)}
						/>
						{#if menuOpen}
							<div
								role="menu"
								class="absolute top-full right-0 z-20 mt-1 flex w-56 flex-col rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
							>
								{#if own}
									{@render item('copy', 'Save as copy', saveAsNew)}
								{:else}
									{#if wall.template}
										{@render item('check', 'Update template', update, wall.layers.length === 0)}
									{/if}
									{@render item(
										'layers',
										'Save as new template',
										saveAsTemplate,
										wall.layers.length === 0
									)}
								{/if}
								{#if editable}
									<hr class="my-1 border-stone-100" />
									{@render item('trash', 'Delete', confirmDelete, false, true)}
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if own}
			<TagInput
				label="Tags"
				hideLabel
				variant="subtle"
				placeholder="Add a country, e.g. Sweden …"
				bind:tags={
					() => wall.template!.keywords,
					(keywords) => wall.updateConfigDetails(wall.templateId, { keywords })
				}
			/>
		{:else if wall.template?.keywords.length}
			<ul class="flex flex-wrap gap-1.5" aria-label="Tags">
				{#each wall.template.keywords as keyword (keyword)}
					<li
						class="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200"
					>
						<Icon name="tag" size={11} class="text-stone-400" />{keyword}
					</li>
				{/each}
			</ul>
		{/if}

		{#if wall.layers.length}
			<div class="flex items-center gap-3">
				<LayerStrip layers={wall.layers} class="h-2 flex-1" />
				<span class="text-xs whitespace-nowrap text-stone-500 tabular-nums">
					{wall.activeLayers.length}
					{wall.activeLayers.length === 1 ? 'layer' : 'layers'} · {fmt(thickness, 0)} mm
				</span>
			</div>
		{/if}

		{#if error}<p class="text-sm text-critical-ink">{error}</p>{/if}
	</div>
</section>

<dialog
	bind:this={deleteDialog}
	aria-labelledby="delete-title"
	class="m-auto w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl backdrop:bg-stone-900/30"
>
	<h2 id="delete-title" class="font-semibold text-stone-900">
		Delete “{wall.template?.name}”?
	</h2>
	<p class="mt-1 text-sm text-stone-500">
		{own
			? 'This build-up will be removed from this browser.'
			: 'This template will be removed for everyone.'} This can’t be undone.
	</p>
	<form method="dialog" class="mt-5 flex justify-end gap-1">
		<Button type="submit" variant="ghost">Cancel</Button>
		<Button icon="trash" disabled={busy} variant="critical" onclick={remove}>Delete</Button>
	</form>
</dialog>
