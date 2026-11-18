<script lang="ts">
	import { resolve } from '$app/paths';
	import { getSettings, setSignupEnabled } from '#lib/admin.remote.ts';
	import PageHeader from '#lib/components/admin/PageHeader.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import { errorMessage } from '#lib/errors.ts';

	let settings = $derived(await getSettings());

	let busy = $state(false);
	let error = $state('');

	async function toggleSignup(enabled: boolean) {
		busy = true;
		error = '';
		try {
			await setSignupEnabled(enabled).updates(
				getSettings().withOverride((current) => ({ ...current, signupEnabled: enabled }))
			);
		} catch (e) {
			error = errorMessage(e, 'Saving failed');
		} finally {
			busy = false;
		}
	}
</script>

<PageHeader
	title="Settings"
	description="Options that apply to everyone using this installation."
/>

<section class="rounded-xl bg-surface ring-1 ring-line">
	<header class="flex items-center gap-2.5 border-b border-line px-5 py-3">
		<Icon name="users" size={16} class="text-fg-subtle" />
		<h2 class="text-sm font-semibold">Accounts</h2>
	</header>

	<label class="flex cursor-pointer items-start justify-between gap-6 px-5 py-4">
		<span class="min-w-0">
			<span class="block text-sm font-medium">Allow sign-up</span>
			<span class="mt-0.5 block text-sm text-pretty text-fg-muted">
				Anyone can create an account at
				<a href={resolve('/signup')} class="font-medium text-fg hover:underline">/signup</a>. New
				accounts are regular users – make them admins on the
				<a href={resolve('/admin/users')} class="font-medium text-fg hover:underline">Users</a> page.
				When off, only admins can add accounts.
			</span>
		</span>
		<input
			type="checkbox"
			role="switch"
			class="switch mt-0.5"
			checked={settings.signupEnabled}
			disabled={busy}
			onchange={(event) => toggleSignup(event.currentTarget.checked)}
		/>
	</label>
	{#if error}<p class="px-5 pb-4 text-sm text-critical-ink">{error}</p>{/if}
</section>
