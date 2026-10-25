<script lang="ts">
	import { signIn, signUp } from '#lib/auth.remote.ts';
	import AppHeader from '#lib/components/AppHeader.svelte';
	import FormField from '#lib/components/ui/FormField.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Admin login · Dew Point Calculator</title></svelte:head>

<AppHeader user={null} />

<main class="mx-auto max-w-md px-4 py-12">
	{#if data.firstRun}
		<Card
			title="Create admin account"
			subtitle="No admin exists yet. The first account becomes the admin – registration closes afterwards."
			icon="layers"
		>
			<form {...signUp} class="flex flex-col gap-4">
				<FormField label="Name" field={signUp.fields.name} type="text" autocomplete="name" />
				<FormField label="Email" field={signUp.fields.email} type="email" autocomplete="email" />
				<FormField
					label="Password"
					field={signUp.fields._password}
					type="password"
					autocomplete="new-password"
				/>
				{#each signUp.fields
					.allIssues()
					?.filter((i) => !i.path?.length) ?? [] as issue (issue.message)}
					<p class="text-sm text-critical-ink">{issue.message}</p>
				{/each}
				<Button type="submit" variant="primary" disabled={!!signUp.pending}>Create account</Button>
			</form>
		</Card>
	{:else}
		<Card title="Admin login" subtitle="Sign in to edit materials and templates." icon="layers">
			<form {...signIn} class="flex flex-col gap-4">
				<FormField label="Email" field={signIn.fields.email} type="email" autocomplete="email" />
				<FormField
					label="Password"
					field={signIn.fields._password}
					type="password"
					autocomplete="current-password"
				/>
				{#each signIn.fields
					.allIssues()
					?.filter((i) => !i.path?.length) ?? [] as issue (issue.message)}
					<p class="text-sm text-critical-ink">{issue.message}</p>
				{/each}
				<Button type="submit" variant="primary" disabled={!!signIn.pending}>Sign in</Button>
			</form>
		</Card>
	{/if}
</main>
