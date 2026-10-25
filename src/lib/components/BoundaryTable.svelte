<script lang="ts">
	import { fmt, fmtSd } from '#lib/format.ts';
	import { getWall } from '#lib/wall.svelte.ts';

	const wall = getWall();

	let rows = $derived(
		wall.result.boundaries.map((node, i) => ({
			label:
				i === 0
					? 'Inner surface'
					: i === wall.result.boundaries.length - 1
						? 'Outer side'
						: `${wall.layerNumber(i - 1)} | ${wall.layerNumber(i)}`,
			node,
			rh: Math.min(100, (node.pv / node.ps) * 100)
		}))
	);
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm tabular-nums">
		<thead>
			<tr class="border-b border-stone-200 text-left text-xs text-stone-500">
				<th class="py-2 pr-3 font-medium">Boundary</th>
				<th class="py-2 pr-3 text-right font-medium">x [mm]</th>
				<th class="py-2 pr-3 text-right font-medium">sd [m]</th>
				<th class="py-2 pr-3 text-right font-medium">θ [°C]</th>
				<th class="py-2 pr-3 text-right font-medium">θ<sub>dew</sub> [°C]</th>
				<th class="py-2 pr-3 text-right font-medium">p<sub>s</sub> [Pa]</th>
				<th class="py-2 pr-3 text-right font-medium">p [Pa]</th>
				<th class="py-2 text-right font-medium">RH [%]</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row, i (i)}
				<tr class={['border-b border-stone-100', row.rh >= 99.9 && 'bg-red-50 text-critical-ink']}>
					<td class="py-1.5 pr-3 whitespace-nowrap">{row.label}</td>
					<td class="py-1.5 pr-3 text-right">{fmt(row.node.x, 1)}</td>
					<td class="py-1.5 pr-3 text-right">{fmtSd(row.node.sd)}</td>
					<td class="py-1.5 pr-3 text-right">{fmt(row.node.t)}</td>
					<td class="py-1.5 pr-3 text-right">{fmt(row.node.dewLinear)}</td>
					<td class="py-1.5 pr-3 text-right">{fmt(row.node.ps, 0)}</td>
					<td class="py-1.5 pr-3 text-right">{fmt(row.node.pv, 0)}</td>
					<td class="py-1.5 text-right">{fmt(row.rh, 0)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
