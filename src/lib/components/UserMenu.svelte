<script lang="ts">
	import { dismiss } from '#lib/dismiss.ts';
	import type { ClientUser } from '#lib/catalog.remote.ts';
	import { resolve } from '$app/paths';
	import { signOut } from '#lib/auth.remote.ts';
	import Icon from '#lib/components/ui/Icon.svelte';

	interface Props {
		user: ClientUser;
	}

	let { user }: Props = $props();

	let open = $state(false);

	let initials = $derived(
		user.name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0].toUpperCase())
			.join('') || '?'
	);
</script>

<div class="relative" {@attach open && dismiss(() => (open = false))}>
	<button
		type="button"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label="User menu"
		title={user.name}
		onclick={() => (open = !open)}
		class="grid size-9 place-items-center rounded-full bg-linear-to-br from-temp to-dew text-xs font-semibold text-white ring-2 ring-surface transition hover:brightness-110 focus-visible:ring-accent focus-visible:outline-none"
	>
		{initials}
	</button>

	{#if open}
		<div
			role="menu"
			class="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl bg-surface p-1 shadow-float ring-1 ring-line"
		>
			<div class="px-3 py-2">
				<p class="truncate text-sm font-medium">{user.name}</p>
				<p class="truncate text-xs text-fg-muted">{user.email}</p>
			</div>
			<hr class="my-1 border-line" />
			{#if user.admin}
				<a
					role="menuitem"
					href={resolve('/admin')}
					onclick={() => (open = false)}
					class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-fg-muted hover:bg-surface-3 hover:text-fg"
				>
					<Icon name="settings" size={15} />
					Admin panel
				</a>
			{/if}
			<form {...signOut}>
				<button
					type="submit"
					role="menuitem"
					class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-fg-muted hover:bg-surface-3 hover:text-fg"
				>
					<Icon name="logout" size={15} />
					Sign out
				</button>
			</form>
		</div>
	{/if}
</div>
