<!-- Toolbar of the calculator: build-up name, status, save button and menu -->
<script lang="ts">
	import type { ClientUser } from '#lib/catalog.remote.ts';
	import { goto } from '$app/navigation';
	import { deleteAssembly, saveAssembly } from '#lib/catalog.remote.ts';
	import AppIcon from '#lib/components/AppIcon.svelte';
	import UserMenu from '#lib/components/UserMenu.svelte';
	import VerdictPill from '#lib/components/VerdictPill.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import { getWall, templatePath } from '#lib/wall.svelte.ts';

	interface Props {
		user: ClientUser | null;
		onlibrary: () => void;
	}

	let { user, onlibrary }: Props = $props();

	const wall = getWall();
	let admin = $derived(!!user?.admin);

	/** The build-up is one of the user's configs */
	let own = $derived(!!wall.template?.config);
	/** The loaded build-up can be overwritten or deleted */
	let editable = $derived(own || (!!wall.template && admin));

	let menuOpen = $state(false);

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
	function show(id: string, config: boolean) {
		wall.templateId = id;
		return goto(templatePath({ id, config }), { replace: true, reset: false });
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
			}),
			true
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
			await show(id, false);
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
			await goto(templatePath());
		});
</script>

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
			'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm disabled:opacity-40 sm:py-2',
			danger
				? 'text-fg-muted hover:bg-critical/10 hover:text-critical-ink'
				: 'text-fg-muted hover:bg-surface-3 hover:text-fg'
		]}
	>
		<Icon name={icon} size={15} />
		{label}
	</button>
{/snippet}

{#snippet actions()}
	{#if wall.template && wall.modified}
		{@render item('reset', 'Discard changes', () => {
			menuOpen = false;
			wall.loadTemplate(wall.templateId);
		})}
	{/if}
	{#if own}
		{@render item('copyPlus', 'Save as copy', saveAsNew)}
	{:else if admin}
		{#if wall.template}
			{@render item('check', 'Update template', update, wall.layers.length === 0)}
		{/if}
		{@render item('layers', 'Save as new template', saveAsTemplate, wall.layers.length === 0)}
	{/if}
	{#if editable}
		<hr class="my-1 border-line" />
		{@render item('trash', 'Delete', confirmDelete, false, true)}
	{/if}
{/snippet}

<header
	class="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 pt-[env(safe-area-inset-top)] sm:gap-3 sm:px-3"
	style:box-sizing="content-box"
>
	<AppIcon class="ml-1 hidden size-7 sm:block" />
	<button
		type="button"
		onclick={onlibrary}
		title="Templates and build-ups (Ctrl+K)"
		class="flex h-10 shrink-0 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-fg-muted transition hover:bg-surface-3 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:h-9"
	>
		<Icon name="layers" size={16} />
		<span class="max-sm:sr-only">Library</span>
		<kbd class="hidden text-[10px] text-fg-subtle xl:inline">⌘K</kbd>
	</button>

	<span class="hidden h-6 w-px bg-line lg:block"></span>

	<div class="flex min-w-0 flex-1 items-center gap-2.5">
		<div class="min-w-0 flex-1 lg:flex-none">
			<div class="flex items-center gap-1.5 text-[11px] leading-tight font-medium text-fg-subtle">
				<Icon name={own ? 'save' : wall.template ? 'home' : 'layers'} size={11} />
				{own ? 'My build-up' : wall.template ? 'Template' : 'New build-up'}
				{#if wall.template && wall.modified}
					<span class="flex items-center gap-1 text-warning-ink">
						<span class="size-1.5 rounded-full bg-warning"></span>Unsaved
					</span>
				{/if}
			</div>
			{#if own}
				<!-- Edited in place; stored when it loses focus -->
				<input
					aria-label="Name"
					maxlength={120}
					class="-mx-1 w-full min-w-0 rounded-md bg-transparent px-1 text-[15px] leading-snug font-semibold tracking-tight outline-none hover:bg-surface-3/60 focus:bg-surface focus:ring-2 focus:ring-accent/40 lg:w-80"
					value={wall.template!.name}
					onkeydown={(event) => {
						if (event.key === 'Enter') event.currentTarget.blur();
					}}
					onchange={(event) => {
						const name = event.currentTarget.value.trim();
						if (name) wall.updateConfigDetails(wall.templateId, { name });
						else event.currentTarget.value = wall.template!.name;
					}}
				/>
			{:else}
				<h1 class="truncate text-[15px] leading-snug font-semibold tracking-tight">
					{wall.template?.name ?? 'Custom build-up'}
				</h1>
			{/if}
		</div>
		<span class="hidden lg:contents"><VerdictPill /></span>
	</div>

	{#if error}<p class="hidden text-xs text-critical-ink sm:block">{error}</p>{/if}

	<div class="flex shrink-0 items-center gap-1 sm:gap-1.5">
		<Button
			variant="accent"
			icon="save"
			disabled={busy || wall.layers.length === 0 || (own && !wall.modified)}
			onclick={own ? update : saveAsNew}
		>
			<span class="max-sm:sr-only">{own ? 'Save' : 'Save as mine'}</span>
		</Button>
		<UserMenu
			{user}
			bind:open={menuOpen}
			disabled={busy}
			actions={own || admin || (wall.template && wall.modified) ? actions : undefined}
		/>
	</div>
</header>

<dialog
	bind:this={deleteDialog}
	aria-labelledby="delete-title"
	class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-surface p-6 text-fg shadow-float ring-1 ring-line backdrop:bg-black/50 backdrop:backdrop-blur-sm"
>
	<span class="grid size-10 place-items-center rounded-full bg-critical/12 text-critical-ink">
		<Icon name="trash" size={18} />
	</span>
	<h2 id="delete-title" class="mt-4 font-semibold">Delete “{wall.template?.name}”?</h2>
	<p class="mt-1 text-sm text-fg-muted">
		{own
			? 'This build-up will be removed from this browser.'
			: 'This template will be removed for everyone.'} This can’t be undone.
	</p>
	<form method="dialog" class="mt-6 flex justify-end gap-2">
		<Button type="submit" variant="ghost">Cancel</Button>
		<Button icon="trash" disabled={busy} variant="critical" onclick={remove}>Delete</Button>
	</form>
</dialog>
