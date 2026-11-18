<!-- Menu in the top right corner: page actions, disclaimer and account -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dismiss } from '#lib/dismiss.ts';
	import type { ClientUser } from '#lib/catalog.remote.ts';
	import { resolve } from '$app/paths';
	import { signOut } from '#lib/auth.remote.ts';
	import Disclaimer from '#lib/components/Disclaimer.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';

	interface Props {
		user: ClientUser | null;
		open?: boolean;
		disabled?: boolean;
		/** Page specific menu items, shown above the general ones */
		actions?: Snippet;
	}

	let { user, open = $bindable(false), disabled = false, actions }: Props = $props();

	let disclaimer = $state<HTMLDialogElement>();

	let initials = $derived(
		user?.name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0].toUpperCase())
			.join('') || '?'
	);

	const itemClass =
		'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-fg-muted hover:bg-surface-3 hover:text-fg sm:py-2';
</script>

<div class="relative" {@attach open && dismiss(() => (open = false))}>
	<button
		type="button"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label="Menu"
		title={user?.name ?? 'Menu'}
		{disabled}
		onclick={() => (open = !open)}
		class={[
			'grid size-9 place-items-center rounded-full transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-40',
			user
				? 'bg-linear-to-br from-temp to-dew text-xs font-semibold text-white ring-2 ring-surface hover:brightness-110'
				: 'bg-surface-3 text-fg-muted ring-1 ring-line hover:text-fg'
		]}
	>
		{#if user}{initials}{:else}<Icon name="user" size={16} />{/if}
	</button>

	{#if open}
		<div
			role="menu"
			class="absolute top-full right-0 z-50 mt-2 flex w-64 flex-col rounded-xl bg-surface p-1 shadow-float ring-1 ring-line"
		>
			{#if user}
				<div class="px-3 py-2">
					<p class="truncate text-sm font-medium">{user.name}</p>
					<p class="truncate text-xs text-fg-muted">{user.email}</p>
				</div>
				<hr class="my-1 border-line" />
			{/if}
			{#if actions}
				{@render actions()}
				<hr class="my-1 border-line" />
			{/if}
			<button
				type="button"
				role="menuitem"
				class={itemClass}
				onclick={() => {
					open = false;
					disclaimer?.showModal();
				}}
			>
				<Icon name="info" size={15} />
				Disclaimer
			</button>
			{#if user?.admin}
				<a
					role="menuitem"
					href={resolve('/admin')}
					onclick={() => (open = false)}
					class={itemClass}
				>
					<Icon name="settings" size={15} />
					Admin panel
				</a>
			{/if}
			<hr class="my-1 border-line" />
			{#if user}
				<form {...signOut}>
					<button type="submit" role="menuitem" class={itemClass}>
						<Icon name="logout" size={15} />
						Sign out
					</button>
				</form>
			{:else}
				<a
					role="menuitem"
					href={resolve('/login')}
					onclick={() => (open = false)}
					class={itemClass}
				>
					<Icon name="login" size={15} />
					Sign in
				</a>
			{/if}
		</div>
	{/if}
</div>

<dialog
	bind:this={disclaimer}
	aria-labelledby="disclaimer-title"
	closedby="any"
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-surface p-6 text-fg shadow-float ring-1 ring-line backdrop:bg-black/50 backdrop:backdrop-blur-sm"
>
	<div class="flex items-center justify-between gap-3">
		<h2 id="disclaimer-title" class="flex items-center gap-2.5 font-semibold tracking-tight">
			<Icon name="info" size={18} class="text-fg-subtle" /> Disclaimer
		</h2>
		<form method="dialog"><Button type="submit" variant="ghost" icon="close" label="Close" /></form>
	</div>
	<div class="mt-3"><Disclaimer /></div>
</dialog>
