<!-- The app icon, also used as favicon and for the installed app -->
<script lang="ts">
	import icon from '#lib/assets/favicon.svg';

	let { class: className }: { class?: string } = $props();
</script>

<img src={icon} alt="" class={['shrink-0 rounded-[24%] shadow-sm shadow-black/20', className]} />
