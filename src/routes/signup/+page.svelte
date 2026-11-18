<script lang="ts">
	import { resolve } from '$app/paths';
	import { signUp } from '#lib/auth.remote.ts';
	import AuthShell from '#lib/components/AuthShell.svelte';
	import FormIssues from '#lib/components/FormIssues.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import FormField from '#lib/components/ui/FormField.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Create account · Dew Point Calculator</title></svelte:head>

<AuthShell
	title={data.firstRun ? 'Create the admin account' : 'Create an account'}
	subtitle={data.firstRun
		? 'No account exists yet. The first account becomes the admin – afterwards, sign-up is only open when an admin allows it.'
		: data.open
			? 'Sign up with your email address.'
			: 'Sign-up is currently closed. Ask an admin to create an account for you.'}
>
	{#if data.open}
		<form {...signUp} class="flex flex-col gap-4">
			<FormField label="Name" field={signUp.fields.name} type="text" autocomplete="name" />
			<FormField label="Email" field={signUp.fields.email} type="email" autocomplete="email" />
			<FormField
				label="Password"
				field={signUp.fields._password}
				type="password"
				autocomplete="new-password"
			/>
			<FormIssues issues={signUp.fields.allIssues()} />
			<Button type="submit" variant="accent" class="mt-1 h-11!" disabled={!!signUp.pending}>
				Create account
			</Button>
		</form>
	{:else}
		<div
			class="flex items-center gap-3 rounded-xl bg-surface-2 p-4 text-sm text-fg-muted ring-1 ring-line"
		>
			<Icon name="lock" size={18} class="text-fg-subtle" />
			Registration is disabled.
		</div>
	{/if}

	{#snippet footer()}
		{#if !data.firstRun}
			Already have an account?
			<a href={resolve('/login')} class="font-medium text-fg hover:underline">Sign in</a>
		{/if}
	{/snippet}
</AuthShell>
