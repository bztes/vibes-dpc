<!-- "⋯" button with a dropdown of actions; `null` entries become separators -->
<script lang="ts" module>
	import type { IconName } from './Icon.svelte';

	export interface Action {
		icon: IconName;
		label: string;
		onclick: () => void;
		danger?: boolean;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { dismiss } from '#lib/dismiss.ts';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		actions: (Action | null)[];
		label?: string;
		disabled?: boolean;
	}

	let { actions, label = 'Actions', disabled = false }: Props = $props();

	let open = $state(false);
	let trigger = $state<HTMLElement>();

	/**
	 * Fixed position next to the trigger, so the menu isn't clipped by scrolling containers (tables);
	 * opens upwards when there isn't enough room below
	 */
	function place(menu: HTMLElement) {
		const update = () => {
			const anchor = trigger!.getBoundingClientRect();
			const { width, height } = menu.getBoundingClientRect();
			const below = window.innerHeight - anchor.bottom;
			menu.style.top = `${below < height + 8 && anchor.top > below ? anchor.top - height - 4 : anchor.bottom + 4}px`;
			menu.style.left = `${Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8))}px`;
		};
		update();
		const close = () => (open = false);
		window.addEventListener('scroll', close, { capture: true, passive: true });
		window.addEventListener('resize', close);
		return () => {
			window.removeEventListener('scroll', close, { capture: true });
			window.removeEventListener('resize', close);
		};
	}
</script>

<div bind:this={trigger} {@attach open && dismiss(() => (open = false))}>
	<Button
		variant="ghost"
		icon="more"
		{label}
		{disabled}
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
	/>
	{#if open}
		<div
			role="menu"
			{@attach place}
			class="fixed z-50 flex w-56 flex-col rounded-xl bg-surface p-1 shadow-float ring-1 ring-line"
		>
			{#each actions as action, i (i)}
				{#if action}
					<button
						type="button"
						role="menuitem"
						disabled={action.disabled}
						onclick={() => {
							open = false;
							action.onclick();
						}}
						class={[
							'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm disabled:opacity-40 sm:py-2',
							action.danger
								? 'text-fg-muted hover:bg-critical/10 hover:text-critical-ink'
								: 'text-fg-muted hover:bg-surface-3 hover:text-fg'
						]}
					>
						<Icon name={action.icon} size={15} />
						{action.label}
					</button>
				{:else}
					<hr class="my-1 border-line" />
				{/if}
			{/each}
		</div>
	{/if}
</div>
