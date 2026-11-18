<!-- Modal dialog; open it with `bind:this` and `.open()` -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props {
		title: string;
		subtitle?: string;
		icon?: IconName;
		/** Icon colour – `critical` for destructive confirmations */
		tone?: 'neutral' | 'critical';
		size?: 'sm' | 'md' | 'lg';
		children?: Snippet;
		/** Buttons at the bottom */
		actions?: Snippet;
		onclose?: () => void;
		class?: string;
	}

	let {
		title,
		subtitle,
		icon,
		tone = 'neutral',
		size = 'md',
		children,
		actions,
		onclose,
		class: className
	}: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	const id = $props.id();

	export function open() {
		dialog?.showModal();
	}

	export function close() {
		dialog?.close();
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="{id}-title"
	closedby="any"
	{onclose}
	class={[
		'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-surface p-0 text-fg shadow-float ring-1 ring-line backdrop:bg-black/50 backdrop:backdrop-blur-sm',
		size === 'sm' && 'max-w-sm',
		size === 'md' && 'max-w-lg',
		size === 'lg' && 'max-w-2xl',
		className
	]}
>
	<div class="flex items-start gap-3.5 px-6 pt-6">
		{#if icon}
			<span
				class={[
					'grid size-10 shrink-0 place-items-center rounded-full',
					tone === 'critical' ? 'bg-critical/12 text-critical-ink' : 'bg-surface-3 text-fg-muted'
				]}
			>
				<Icon name={icon} size={18} />
			</span>
		{/if}
		<div class="min-w-0 flex-1 pt-0.5">
			<h2 id="{id}-title" class="font-semibold tracking-tight">{title}</h2>
			{#if subtitle}<p class="mt-1 text-sm text-pretty text-fg-muted">{subtitle}</p>{/if}
		</div>
		<Button variant="ghost" icon="close" label="Close" class="-mt-1 -mr-2" onclick={close} />
	</div>
	{#if children}<div class="px-6 pt-5">{@render children()}</div>{/if}
	<div class="flex flex-wrap justify-end gap-2 px-6 pt-6 pb-6">
		{#if actions}{@render actions()}{:else}
			<Button variant="secondary" onclick={close}>Close</Button>
		{/if}
	</div>
</dialog>
