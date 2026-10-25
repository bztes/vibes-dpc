<script lang="ts">
	import { resolve } from '$app/paths';
	import { signOut } from '#lib/auth.remote.ts';
	import AppIcon from '#lib/components/AppIcon.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';

	interface Props {
		user: { name: string; email: string; admin: boolean } | null;
	}

	let { user }: Props = $props();

	let menuOpen = $state(false);
	let menu = $state<HTMLElement>();

	let initials = $derived(
		(user?.name ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0].toUpperCase())
			.join('') || '?'
	);
</script>

<svelte:window
	onclick={(event) => {
		if (menuOpen && !menu?.contains(event.target as Node)) menuOpen = false;
	}}
	onkeydown={(event) => {
		if (event.key === 'Escape') menuOpen = false;
	}}
/>

<header class="sticky top-0 z-30 border-b border-stone-200/80 bg-white/85 backdrop-blur">
	<div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
		<a href={resolve('/')} class="flex items-center gap-2.5">
			<AppIcon class="size-9" />
			<span>
				<span class="block leading-tight font-semibold text-stone-900">Dew Point Calculator</span>
				<span class="hidden text-xs text-stone-500 sm:block"
					>Condensation risk in building envelopes</span
				>
			</span>
		</a>

		{#if user}
			<div class="relative" bind:this={menu}>
				<button
					type="button"
					aria-haspopup="menu"
					aria-expanded={menuOpen}
					aria-label="User menu"
					onclick={() => (menuOpen = !menuOpen)}
					class="flex items-center gap-2 rounded-full p-0.5 pr-2 text-sm text-stone-700 transition hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
				>
					<span
						class="grid size-8 place-items-center rounded-full bg-linear-to-br from-sky-100 to-sky-200 text-xs font-semibold text-sky-900"
						>{initials}</span
					>
					<span class="hidden max-w-40 truncate font-medium sm:block">{user.name}</span>
					<Icon
						name="chevron"
						size={14}
						class={['text-stone-400 transition', menuOpen && 'rotate-180']}
					/>
				</button>

				{#if menuOpen}
					<div
						role="menu"
						class="absolute top-full right-0 z-40 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
					>
						<div class="px-2.5 py-2">
							<p class="truncate text-sm font-medium text-stone-900">{user.name}</p>
							<p class="truncate text-xs text-stone-500">{user.email}</p>
						</div>
						<hr class="my-1 border-stone-100" />
						{#if user.admin}
							<a
								role="menuitem"
								href={resolve('/admin')}
								onclick={() => (menuOpen = false)}
								class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-stone-700 hover:bg-stone-100 hover:text-stone-900"
							>
								<Icon name="settings" size={15} />
								Admin panel
							</a>
						{/if}
						<form {...signOut}>
							<button
								type="submit"
								role="menuitem"
								class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-100 hover:text-stone-900"
							>
								<Icon name="logout" size={15} />
								Sign out
							</button>
						</form>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</header>
