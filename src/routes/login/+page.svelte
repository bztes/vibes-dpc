<script lang="ts">
	import { resolve } from '$app/paths';
	import { signIn } from '#lib/auth.remote.ts';
	import AuthShell from '#lib/components/AuthShell.svelte';
	import FormIssues from '#lib/components/FormIssues.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import FormField from '#lib/components/ui/FormField.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Sign in · Dew Point Calculator</title></svelte:head>

<AuthShell title="Welcome back" subtitle="Sign in to your account.">
	<form {...signIn} class="flex flex-col gap-4">
		<FormField label="Email" field={signIn.fields.email} type="email" autocomplete="email" />
		<FormField
			label="Password"
			field={signIn.fields._password}
			type="password"
			autocomplete="current-password"
		/>
		<FormIssues issues={signIn.fields.allIssues()} />
		<Button type="submit" variant="accent" class="mt-1 h-11!" disabled={!!signIn.pending}>
			Sign in
		</Button>
	</form>

	{#snippet footer()}
		{#if data.signupOpen}
			No account yet?
			<a href={resolve('/signup')} class="font-medium text-fg hover:underline">Create one</a>
		{/if}
	{/snippet}
</AuthShell>
