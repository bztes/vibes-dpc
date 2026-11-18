<script lang="ts">
	import { resolve } from '$app/paths';
	import { getSettings, getStats, getUsers } from '#lib/admin.remote.ts';
	import { getUser } from '#lib/catalog.remote.ts';
	import PageHeader from '#lib/components/admin/PageHeader.svelte';
	import UserAvatar from '#lib/components/admin/UserAvatar.svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import { relativeTime } from '#lib/format.ts';

	let [stats, settings, users, me] = $derived(
		await Promise.all([getStats(), getSettings(), getUsers(), getUser()])
	);

	let recent = $derived(users.toSorted((a, b) => b.createdAt - a.createdAt).slice(0, 5));

	let tiles = $derived<
		{ label: string; value: number; hint: string; icon: IconName; href: string }[]
	>([
		{
			label: 'Templates',
			value: stats.templates,
			hint: 'Build-ups in the library',
			icon: 'layers',
			href: '/admin/templates' as const
		},
		{
			label: 'Materials',
			value: stats.materials,
			hint: 'In the catalogue',
			icon: 'wall',
			href: '/admin/materials' as const
		},
		{
			label: 'Users',
			value: stats.users,
			hint: `${stats.admins} ${stats.admins === 1 ? 'admin' : 'admins'}`,
			icon: 'users',
			href: '/admin/users' as const
		}
	]);
</script>

<PageHeader
	title="Overview"
	description="Welcome back, {me?.name.split(' ')[0]}. Here’s what’s in the calculator."
/>

<div class="grid gap-3 sm:grid-cols-3">
	{#each tiles as tile (tile.label)}
		<a
			href={resolve(tile.href)}
			class="group flex flex-col gap-4 rounded-xl bg-surface p-5 ring-1 ring-line transition hover:shadow-panel hover:ring-line-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-fg-muted">{tile.label}</span>
				<span
					class="grid size-8 place-items-center rounded-lg bg-surface-3 text-fg-muted transition group-hover:bg-accent/12 group-hover:text-accent"
				>
					<Icon name={tile.icon} size={16} />
				</span>
			</div>
			<div>
				<div class="text-3xl font-semibold tracking-tight tabular-nums">{tile.value}</div>
				<div class="mt-0.5 text-xs text-fg-subtle">{tile.hint}</div>
			</div>
		</a>
	{/each}
</div>

<div class="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
	<section class="rounded-xl bg-surface ring-1 ring-line">
		<header class="flex items-center justify-between border-b border-line px-5 py-3">
			<h2 class="text-sm font-semibold">Newest accounts</h2>
			<a href={resolve('/admin/users')} class="text-xs font-medium text-fg-muted hover:text-fg">
				All users →
			</a>
		</header>
		<ul class="divide-y divide-line">
			{#each recent as user (user.id)}
				<li class="flex items-center gap-3 px-5 py-3">
					<UserAvatar name={user.name} />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{user.name}</p>
						<p class="truncate text-xs text-fg-muted">{user.email}</p>
					</div>
					{#if user.role === 'admin'}<Badge tone="info" icon="shield">Admin</Badge>{/if}
					<span class="hidden text-xs whitespace-nowrap text-fg-subtle sm:inline">
						{relativeTime(user.createdAt)}
					</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="flex flex-col rounded-xl bg-surface ring-1 ring-line">
		<header class="border-b border-line px-5 py-3">
			<h2 class="text-sm font-semibold">Sign-up</h2>
		</header>
		<div class="flex flex-1 flex-col items-start gap-3 p-5">
			<Badge
				tone={settings.signupEnabled ? 'good' : 'neutral'}
				icon={settings.signupEnabled ? 'check' : 'lock'}
			>
				{settings.signupEnabled ? 'Open' : 'Closed'}
			</Badge>
			<p class="text-sm text-pretty text-fg-muted">
				{settings.signupEnabled
					? 'Anyone can create an account. New accounts are regular users.'
					: 'Only admins can add accounts.'}
			</p>
			<a
				href={resolve('/admin/settings')}
				class="mt-auto text-xs font-medium text-fg-muted hover:text-fg"
			>
				Change in settings →
			</a>
		</div>
	</section>
</div>
