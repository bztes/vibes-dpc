<!-- How the calculation works, with the disclaimer -->
<script lang="ts">
	import Disclaimer from '#lib/components/Disclaimer.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';

	let dialog = $state<HTMLDialogElement>();

	export function open() {
		dialog?.showModal();
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="about-title"
	closedby="any"
	class="m-auto max-h-[min(44rem,calc(100dvh-2rem))] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-surface p-0 text-fg shadow-float ring-1 ring-line backdrop:bg-black/50 backdrop:backdrop-blur-sm"
>
	<div
		class="sticky top-0 flex items-center justify-between gap-3 bg-surface/90 px-6 pt-5 pb-3 backdrop-blur"
	>
		<h2 id="about-title" class="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
			<Icon name="book" size={18} class="text-fg-subtle" /> How it works
		</h2>
		<form method="dialog"><Button type="submit" variant="ghost" icon="close" label="Close" /></form>
	</div>
	<div class="flex flex-col gap-5 px-6 pb-6 text-sm/relaxed text-pretty text-fg-muted">
		<section>
			<h3 class="mb-1 font-semibold text-fg">Temperature profile</h3>
			<p>
				The temperature drops across each layer in proportion to its thermal resistance R = d/λ.
				Surface resistances are R<sub>si</sub> = 0.25 and R<sub>se</sub> = 0.04 m²K/W (0.08 behind a ventilation
				gap). Layers outside a ventilated air gap are ignored.
			</p>
		</section>
		<section>
			<h3 class="mb-1 font-semibold text-fg">Dew point & condensation</h3>
			<p>
				The indoor air has a dew point (e.g. 9.3 °C at 20 °C / 50 %). Reaching it inside the
				build-up alone is not a problem – what matters is how much vapour gets there. The Glaser
				method compares the vapour pressure with the saturation pressure; where they meet,
				condensation forms.
			</p>
		</section>
		<section>
			<h3 class="mb-1 font-semibold text-fg">Limitations</h3>
			<p>
				A steady-state estimate (EN ISO 13788) without capillary transport, moisture storage or
				thermal bridges. Capillary-active internal insulation is rated conservatively. For a
				detailed assessment use a hygrothermal simulation (e.g. WUFI).
			</p>
		</section>
		<div class="border-t border-line pt-4"><Disclaimer /></div>
	</div>
</dialog>
