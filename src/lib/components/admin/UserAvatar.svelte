<!-- Initials on the app's warm-to-cold gradient -->
<script lang="ts">
	interface Props {
		name: string;
		size?: 'sm' | 'md';
	}

	let { name, size = 'md' }: Props = $props();

	let initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0].toUpperCase())
			.join('') || '?'
	);
</script>

<span
	aria-hidden="true"
	class={[
		'grid shrink-0 place-items-center rounded-full bg-linear-to-br from-temp to-dew font-semibold text-white',
		size === 'sm' ? 'size-7 text-[10px]' : 'size-9 text-xs'
	]}
>
	{initials}
</span>
