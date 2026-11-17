<!-- Tags as removable chips; Enter or comma adds the typed tag, Backspace removes the last one -->
<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		tags: string[];
		label: string;
		hideLabel?: boolean;
		placeholder?: string;
		/** `subtle` has no border until hovered or focused */
		variant?: 'field' | 'subtle';
		max?: number;
		maxlength?: number;
		class?: string;
	}

	let {
		tags = $bindable(),
		label,
		hideLabel = false,
		placeholder = 'Add tag …',
		variant = 'field',
		max = 30,
		maxlength = 60,
		class: className
	}: Props = $props();

	const id = $props.id();

	let text = $state('');
	let input = $state<HTMLInputElement>();

	/** Adds the comma-separated tags in `value`, skipping duplicates regardless of case */
	function add(value: string) {
		const known = tags.map((tag) => tag.toLowerCase());
		const added: string[] = [];
		for (const part of value.split(',')) {
			const tag = part.trim().slice(0, maxlength);
			if (!tag || known.includes(tag.toLowerCase())) continue;
			known.push(tag.toLowerCase());
			added.push(tag);
		}
		if (added.length) tags = [...tags, ...added].slice(0, max);
		text = '';
	}

	function remove(index: number) {
		tags = tags.toSpliced(index, 1);
		input?.focus();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			add(text);
		} else if (event.key === 'Backspace' && !text && tags.length) {
			event.preventDefault();
			// Put the last tag back into the input so it can be corrected
			text = tags.at(-1)!;
			tags = tags.slice(0, -1);
		}
	}
</script>

<div class={['flex flex-col gap-1', className]}>
	<label for={id} class={hideLabel ? 'sr-only' : 'text-xs font-medium text-fg-muted'}>{label}</label
	>
	<!-- Clicking the empty space next to the chips focuses the input -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class={[
			'flex min-h-9 cursor-text flex-wrap items-center gap-1.5 rounded-lg text-sm transition',
			variant === 'field' &&
				'border border-line-strong bg-surface px-2 py-1.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15',
			variant === 'subtle' &&
				'-mx-1.5 px-1.5 py-1 focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent/30 hover:bg-surface-3/60'
		]}
		onclick={(event) => event.target === event.currentTarget && input?.focus()}
	>
		{#each tags as tag, i (tag)}
			<span
				class="inline-flex items-center gap-0.5 rounded-md bg-accent/12 py-0.5 pr-0.5 pl-2 text-xs font-medium text-accent"
			>
				{tag}
				<button
					type="button"
					class="grid size-4 place-items-center rounded text-accent hover:bg-accent/20"
					aria-label="Remove tag {tag}"
					onclick={() => remove(i)}
				>
					<Icon name="close" size={10} />
				</button>
			</span>
		{/each}
		{#if tags.length < max}
			<input
				{id}
				bind:this={input}
				bind:value={text}
				{maxlength}
				{onkeydown}
				onblur={() => add(text)}
				onpaste={(event) => {
					const pasted = event.clipboardData?.getData('text') ?? '';
					if (!pasted.includes(',')) return;
					event.preventDefault();
					add(text + pasted);
				}}
				placeholder={tags.length ? '' : placeholder}
				class="h-7 min-w-24 flex-1 bg-transparent text-base outline-none placeholder:text-fg-subtle sm:h-6 sm:text-sm"
			/>
		{/if}
	</div>
</div>
