<!-- Header of the admin pages; the calculator has its own toolbar -->
<script lang="ts">
	import AppIcon from '#lib/components/AppIcon.svelte';
	import UserMenu from '#lib/components/UserMenu.svelte';
	import type { ClientUser } from '#lib/catalog.remote.ts';
	import { templatePath } from '#lib/wall.svelte.ts';

	interface Props {
		user: ClientUser | null;
		/** Shown next to the app name */
		section?: string;
	}

	let { user, section }: Props = $props();
</script>

<header
	class="sticky top-0 z-30 border-b border-line bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150"
>
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
		<div class="flex items-center gap-3">
			<a
				href={templatePath()}
				class="-mx-1.5 flex items-center gap-2.5 rounded-xl px-1.5 py-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
			>
				<AppIcon class="size-8" />
				<span class="text-[15px] font-semibold tracking-tight">Dew Point</span>
			</a>
			{#if section}
				<span class="h-5 w-px bg-line-strong"></span>
				<span class="text-[15px] font-medium tracking-tight text-fg-muted">{section}</span>
			{/if}
		</div>
		<UserMenu {user} />
	</div>
</header>
