<script lang="ts">
	import {
		addUser,
		deleteUser,
		endUserSessions,
		getUsers,
		resetUserPassword,
		setUserRole,
		type AdminUser
	} from '#lib/admin.remote.ts';
	import PageHeader from '#lib/components/admin/PageHeader.svelte';
	import UserAvatar from '#lib/components/admin/UserAvatar.svelte';
	import ActionMenu from '#lib/components/ui/ActionMenu.svelte';
	import Badge from '#lib/components/ui/Badge.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import SearchField from '#lib/components/ui/SearchField.svelte';
	import SegmentedControl from '#lib/components/ui/SegmentedControl.svelte';
	import TextField from '#lib/components/ui/TextField.svelte';
	import { errorMessage } from '#lib/errors.ts';
	import { formatDate, relativeTime, searchMatcher } from '#lib/format.ts';

	let users = $derived(await getUsers());

	let search = $state('');
	let roleFilter = $state<'all' | 'admin' | 'user'>('all');

	let matcher = $derived(searchMatcher(search));
	let visible = $derived(
		users.filter(
			(user) =>
				(roleFilter === 'all' || user.role === roleFilter) && matcher(`${user.name} ${user.email}`)
		)
	);

	let busy = $state(false);
	let error = $state('');

	/** Runs a remote call; returns whether it succeeded */
	async function run(action: () => Promise<unknown>) {
		busy = true;
		error = '';
		try {
			await action();
			return true;
		} catch (e) {
			error = errorMessage(e);
			return false;
		} finally {
			busy = false;
		}
	}

	// ─── Add user ───
	let addDialog = $state<Dialog>();
	let draft = $state({ name: '', email: '', password: '', role: 'user' as AdminUser['role'] });

	function openAdd() {
		draft = { name: '', email: '', password: '', role: 'user' };
		error = '';
		addDialog?.open();
	}

	// ─── Password ───
	let passwordDialog = $state<Dialog>();
	let passwordUser = $state<AdminUser>();
	let password = $state('');

	// ─── Delete ───
	let deleteDialog = $state<Dialog>();
	let deleteTarget = $state<AdminUser>();

	const roleLabel = (user: AdminUser) => (user.role === 'admin' ? 'Admin' : 'User');
</script>

<PageHeader
	title="Users"
	description="{users.length} {users.length === 1
		? 'account'
		: 'accounts'}. Admins can edit templates, materials and settings."
>
	{#snippet actions()}
		<Button variant="accent" icon="userPlus" onclick={openAdd}>Add user</Button>
	{/snippet}
</PageHeader>

<div class="flex flex-wrap items-center gap-2">
	<SearchField bind:value={search} placeholder="Search by name or email …" class="w-full sm:w-72" />
	<SegmentedControl
		label="Role"
		bind:value={roleFilter}
		size="md"
		options={[
			{ value: 'all', label: 'All' },
			{ value: 'admin', label: 'Admins' },
			{ value: 'user', label: 'Users' }
		]}
	/>
</div>

{#if error}<p class="text-sm text-critical-ink" role="alert">{error}</p>{/if}

<div class="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-line bg-surface-2 text-xs text-fg-muted">
				<tr>
					<th class="px-5 py-2.5 font-medium">Name</th>
					<th class="px-3 py-2.5 font-medium">Role</th>
					<th class="hidden px-3 py-2.5 font-medium md:table-cell">Signed in on</th>
					<th class="hidden px-3 py-2.5 font-medium sm:table-cell">Joined</th>
					<th class="w-12 px-3 py-2.5"><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-line">
				{#each visible as user (user.id)}
					<tr class="transition-colors hover:bg-surface-2/60">
						<td class="px-5 py-3">
							<div class="flex items-center gap-3">
								<UserAvatar name={user.name} />
								<div class="min-w-0">
									<p class="flex items-center gap-2 truncate font-medium">
										{user.name}
										{#if user.self}<Badge>You</Badge>{/if}
									</p>
									<p class="truncate text-xs text-fg-muted">{user.email}</p>
								</div>
							</div>
						</td>
						<td class="px-3 py-3">
							<Badge
								tone={user.role === 'admin' ? 'info' : 'neutral'}
								icon={user.role === 'admin' ? 'shield' : 'user'}
							>
								{roleLabel(user)}
							</Badge>
						</td>
						<td class="hidden px-3 py-3 text-fg-muted tabular-nums md:table-cell">
							{user.sessions
								? `${user.sessions} ${user.sessions === 1 ? 'device' : 'devices'}`
								: '–'}
						</td>
						<td
							class="hidden px-3 py-3 text-fg-muted sm:table-cell"
							title={formatDate(user.createdAt)}
						>
							{relativeTime(user.createdAt)}
						</td>
						<td class="px-3 py-3 text-right">
							{#if !user.self}
								<ActionMenu
									label="Actions for {user.name}"
									disabled={busy}
									actions={[
										user.role === 'admin'
											? {
													icon: 'user',
													label: 'Make regular user',
													onclick: () => run(() => setUserRole({ id: user.id, role: 'user' }))
												}
											: {
													icon: 'shield',
													label: 'Make admin',
													onclick: () => run(() => setUserRole({ id: user.id, role: 'admin' }))
												},
										{
											icon: 'key',
											label: 'Set new password',
											onclick: () => {
												passwordUser = user;
												password = '';
												error = '';
												passwordDialog?.open();
											}
										},
										{
											icon: 'logout',
											label: 'Sign out everywhere',
											disabled: !user.sessions,
											onclick: () => run(() => endUserSessions(user.id))
										},
										null,
										{
											icon: 'trash',
											label: 'Delete account',
											danger: true,
											onclick: () => {
												deleteTarget = user;
												error = '';
												deleteDialog?.open();
											}
										}
									]}
								/>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="px-5 py-12 text-center text-sm text-fg-muted">
							No users match your search.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<Dialog
	bind:this={addDialog}
	onclose={() => (error = '')}
	title="Add user"
	subtitle="The account can sign in straight away – share the password with them."
	icon="userPlus"
>
	<form
		id="add-user"
		class="flex flex-col gap-3"
		onsubmit={async (event) => {
			event.preventDefault();
			if (await run(() => addUser($state.snapshot(draft)))) addDialog?.close();
		}}
	>
		<TextField label="Name" required autocomplete="off" bind:value={draft.name} />
		<TextField label="Email" type="email" required autocomplete="off" bind:value={draft.email} />
		<TextField
			label="Password"
			type="password"
			required
			minlength={8}
			maxlength={100}
			autocomplete="new-password"
			bind:value={draft.password}
		/>
		<div class="flex flex-col gap-1">
			<span class="text-xs font-medium text-fg-muted">Role</span>
			<SegmentedControl
				label="Role"
				fill
				size="md"
				bind:value={draft.role}
				options={[
					{ value: 'user', label: 'User', icon: 'user' },
					{ value: 'admin', label: 'Admin', icon: 'shield' }
				]}
			/>
		</div>
		{#if error}<p class="text-sm text-critical-ink">{error}</p>{/if}
	</form>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => addDialog?.close()}>Cancel</Button>
		<Button type="submit" form="add-user" variant="accent" disabled={busy}>Add user</Button>
	{/snippet}
</Dialog>

<Dialog
	bind:this={passwordDialog}
	onclose={() => (error = '')}
	title="New password for {passwordUser?.name}"
	subtitle="They will be signed out on all devices."
	icon="key"
>
	<form
		id="set-password"
		onsubmit={async (event) => {
			event.preventDefault();
			if (await run(() => resetUserPassword({ id: passwordUser!.id, password })))
				passwordDialog?.close();
		}}
	>
		<TextField
			label="New password"
			type="password"
			required
			minlength={8}
			maxlength={100}
			autocomplete="new-password"
			bind:value={password}
		/>
		{#if error}<p class="mt-3 text-sm text-critical-ink">{error}</p>{/if}
	</form>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => passwordDialog?.close()}>Cancel</Button>
		<Button type="submit" form="set-password" variant="accent" disabled={busy}>Set password</Button>
	{/snippet}
</Dialog>

<Dialog
	bind:this={deleteDialog}
	onclose={() => (error = '')}
	size="sm"
	tone="critical"
	icon="trash"
	title="Delete {deleteTarget?.name}?"
	subtitle="The account and its sessions are removed. This can’t be undone."
>
	{#if error}<p class="text-sm text-critical-ink">{error}</p>{/if}
	{#snippet actions()}
		<Button variant="ghost" onclick={() => deleteDialog?.close()}>Cancel</Button>
		<Button
			variant="critical"
			icon="trash"
			disabled={busy}
			onclick={async () => {
				if (await run(() => deleteUser(deleteTarget!.id))) deleteDialog?.close();
			}}
		>
			Delete
		</Button>
	{/snippet}
</Dialog>
