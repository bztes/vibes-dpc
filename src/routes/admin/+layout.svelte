<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getUser } from '#lib/catalog.remote.ts';
	import AppHeader from '#lib/components/AppHeader.svelte';
	import Icon, { type IconName } from '#lib/components/ui/Icon.svelte';
	import { templatePath } from '#lib/wall.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	let user = $derived(await getUser());

	const nav: {
		href: '/admin' | '/admin/templates' | '/admin/materials' | '/admin/users' | '/admin/settings';
		label: string;
		icon: IconName;
	}[] = [
		{ href: '/admin', label: 'Overview', icon: 'dashboard' },
		{ href: '/admin/templates', label: 'Templates', icon: 'layers' },
		{ href: '/admin/materials', label: 'Materials', icon: 'wall' },
		{ href: '/admin/users', label: 'Users', icon: 'users' },
		{ href: '/admin/settings', label: 'Settings', icon: 'settings' }
	];

	const active = (href: string) =>
		href === resolve('/admin')
			? page.url.pathname === href
			: page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<AppHeader {user} section="Admin" />

<div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-10 lg:py-10">
	<nav aria-label="Admin" class="shrink-0 lg:w-52">
		<div class="flex flex-col gap-1 lg:sticky lg:top-24">
			<ul
				class="-mx-4 flex scroll-thin gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
			>
				{#each nav as item (item.href)}
					{@const current = active(resolve(item.href))}
					<li>
						<a
							href={resolve(item.href)}
							aria-current={current ? 'page' : undefined}
							{@attach (link) => {
								// The tabs scroll sideways on small screens
								if (current) link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
							}}
							class={[
								'flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
								current
									? 'bg-surface text-fg shadow-panel ring-1 ring-line'
									: 'text-fg-muted hover:bg-surface-3/70 hover:text-fg'
							]}
						>
							<Icon name={item.icon} size={16} class={current ? 'text-accent' : ''} />
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
			<hr class="my-3 hidden border-line lg:block" />
			<a
				href={templatePath()}
				class="hidden h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-fg-muted transition hover:bg-surface-3/70 hover:text-fg lg:flex"
			>
				<Icon name="back" size={16} />
				Back to calculator
			</a>
		</div>
	</nav>

	<main class="flex min-w-0 flex-1 flex-col gap-6">
		{@render children()}
	</main>
</div>
