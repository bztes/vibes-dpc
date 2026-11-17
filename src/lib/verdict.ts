import type { IconName } from '#lib/components/ui/Icon.svelte';
import { fmt } from '#lib/format.ts';
import { COLD_PERIOD_DAYS, CONDENSATE_LIMIT, MOULD_RH } from '#lib/physics/glaser.ts';
import type { WallModel } from '#lib/wall.svelte.ts';

export type VerdictTone = 'good' | 'warning' | 'critical';

export interface Verdict {
	tone: VerdictTone;
	icon: IconName;
	title: string;
	text: string;
}

/** Tailwind classes per tone; the soft pill style comes from `Badge`'s `toneClasses` */
export const verdictStyles: Record<
	VerdictTone,
	{ tint: string; solid: string; ink: string; dot: string }
> = {
	good: { tint: 'bg-good/6', solid: 'bg-good text-white', ink: 'text-good-ink', dot: 'bg-good' },
	warning: {
		tint: 'bg-warning/8',
		solid: 'bg-warning text-black',
		ink: 'text-warning-ink',
		dot: 'bg-warning'
	},
	critical: {
		tint: 'bg-critical/6',
		solid: 'bg-critical text-white',
		ink: 'text-critical-ink',
		dot: 'bg-critical'
	}
};

/** Overall assessment of the build-up under the current climate */
export function getVerdict(wall: WallModel): Verdict {
	const result = wall.result;
	const layerName = (index: number) =>
		`${wall.layerNumber(index)} “${wall.activeLayers[index]?.name ?? ''}”`;

	if (result.condensation.length > 0) {
		const layers = [...new Set(result.condensation.flatMap((zone) => zone.layers))];
		const mass = (result.condensationRate * 24 * COLD_PERIOD_DAYS) / 1000;
		const minor = mass <= CONDENSATE_LIMIT;
		return {
			tone: minor ? 'warning' : 'critical',
			icon: minor ? 'alert' : 'drop',
			title: minor ? 'Minor interstitial condensation' : 'Interstitial condensation',
			text: `Water vapour condenses in layer ${layers.map(layerName).join(', ')}. Rate approx. ${fmt(result.condensationRate, 2)} g/(m²·h) – over a ${COLD_PERIOD_DAYS}-day cold period ≈ ${fmt(mass, 2)} kg/m²${minor ? ` (below the ${fmt(CONDENSATE_LIMIT, 1)} kg/m² limit of DIN 4108-3, provided it dries out in summer).` : '.'}`
		};
	}
	if (result.surfaceRH >= 100) {
		return {
			tone: 'critical',
			icon: 'drop',
			title: 'Surface condensation',
			text: `The inner surface (${fmt(result.tSi)} °C) is colder than the indoor dew point (${fmt(result.dewPointIn)} °C).`
		};
	}
	if (result.surfaceRH > MOULD_RH) {
		return {
			tone: 'warning',
			icon: 'alert',
			title: 'Mould risk on the inner surface',
			text: `Relative humidity at the surface is ${fmt(result.surfaceRH, 0)} % (limit ${MOULD_RH} %). There is no condensation inside the wall.`
		};
	}
	return {
		tone: 'good',
		icon: 'check',
		title: 'No condensation',
		text: result.dewPlane
			? `The indoor dew point (${fmt(result.dewPointIn)} °C) is reached in layer ${layerName(result.dewPlane.layer)} – but so little vapour gets there that the vapour pressure stays below saturation.`
			: `The entire build-up stays warmer than the indoor dew point (${fmt(result.dewPointIn)} °C).`
	};
}
