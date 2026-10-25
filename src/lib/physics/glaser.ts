/**
 * Steady-state condensation analysis using the Glaser method (based on EN ISO 13788).
 *
 * Conventions:
 * - Layers are listed from inside to outside, thicknesses in mm.
 * - From the first ventilated air layer onwards, all further layers (ventilation gap, cladding)
 *   are ignored thermally and for diffusion; outdoor climate applies there.
 * - The temperature profile for the moisture analysis uses Rsi = 0.25 and Rse = 0.04 (ventilated 0.08),
 *   the U-value uses EN ISO 6946 values (0.13 / 0.04, ventilated 0.13).
 */
import type { Climate, Layer } from './types';

export const R_SI = 0.25;
export const R_SE = 0.04;
export const R_SE_VENTILATED = 0.08;
export const R_SI_U = 0.13;
export const R_SE_U = 0.04;
export const R_SE_U_VENTILATED = 0.13;

/** Water vapour permeability of still air in kg/(m·s·Pa) */
export const DELTA_AIR = 2e-10;

/** Surface relative humidity threshold for mould growth (EN ISO 13788) */
export const MOULD_RH = 80;

/** Tolerable condensate mass over the cold period in kg/m² (DIN 4108-3, non-absorbent interfaces) */
export const CONDENSATE_LIMIT = 0.5;

/** Length of the cold period used to estimate the condensate mass in days */
export const COLD_PERIOD_DAYS = 90;

/** Saturation vapour pressure in Pa (Magnus formula per EN ISO 13788) */
export function saturationPressure(t: number): number {
	return t >= 0
		? 610.5 * Math.exp((17.269 * t) / (237.3 + t))
		: 610.5 * Math.exp((21.875 * t) / (265.5 + t));
}

/** Specific gas constant of water vapour in J/(kg·K) */
const R_VAPOUR = 461.5;

/** Indoor vapour excess in g/m³ at outdoor temperatures ≤ 0 °C per humidity class (EN ISO 13788, Annex A) */
export const VAPOUR_EXCESS = { 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 } as const;

export type HumidityClass = keyof typeof VAPOUR_EXCESS;

/**
 * Indoor relative humidity in % resulting from the outdoor air plus the vapour excess of a
 * humidity class. The excess decreases linearly to zero at 20 °C outdoors (EN ISO 13788, Annex A).
 */
export function indoorHumidity(
	tIn: number,
	tOut: number,
	rhOut: number,
	humidityClass: HumidityClass
): number {
	// Absolute humidity in g/m³
	const vOut = ((rhOut / 100) * saturationPressure(tOut) * 1000) / (R_VAPOUR * (tOut + 273.15));
	const excess = VAPOUR_EXCESS[humidityClass] * Math.min(1, Math.max(0, (20 - tOut) / 20));
	const pvIn = ((vOut + excess) / 1000) * R_VAPOUR * (tIn + 273.15);
	return Math.min(100, (100 * pvIn) / saturationPressure(tIn));
}

/** Dew point temperature in °C for a vapour partial pressure in Pa */
export function dewPoint(pv: number): number {
	if (pv <= 0) return -Infinity;
	const ln = Math.log(pv / 610.5);
	const t = (237.3 * ln) / (17.269 - ln);
	return t >= 0 ? t : (265.5 * ln) / (21.875 - ln);
}

export interface ProfileNode {
	/** Position from the inner surface in mm */
	x: number;
	/** Cumulative equivalent air layer thickness (sd) in m */
	sd: number;
	/** Temperature in °C */
	t: number;
	/** Saturation vapour pressure in Pa */
	ps: number;
	/** Index of the layer this node belongs to */
	layer: number;
}

interface Profile {
	nodes: ProfileNode[];
	/** Number of effective layers (before the first ventilated air layer) */
	activeCount: number;
	ventilated: boolean;
	sdTotal: number;
	tSi: number;
	tSe: number;
}

export function activeLayerCount(layers: Layer[]): number {
	const index = layers.findIndex((layer) => layer.ventilated);
	return index === -1 ? layers.length : index;
}

function buildProfile(layers: Layer[], tIn: number, tOut: number): Profile {
	const activeCount = activeLayerCount(layers);
	const ventilated = activeCount < layers.length;
	const rse = ventilated ? R_SE_VENTILATED : R_SE;

	const raw: { x: number; sd: number; r: number; layer: number }[] = [
		{ x: 0, sd: 0, r: R_SI, layer: 0 }
	];
	let x = 0;
	let sd = 0;
	let r = R_SI;

	for (let i = 0; i < activeCount; i++) {
		const { thickness, lambda, mu } = layers[i];
		const d = thickness / 1000;
		// Subdivide so that condensation inside homogeneous layers is detected too
		const steps = Math.min(40, Math.max(1, Math.ceil(thickness / 5)));
		for (let k = 1; k <= steps; k++) {
			const f = k / steps;
			raw.push({
				x: x + f * thickness,
				sd: sd + f * mu * d,
				r: r + (f * d) / lambda,
				layer: i
			});
		}
		x += thickness;
		sd += mu * d;
		r += d / lambda;
	}

	const rTotal = r + rse;
	const nodes = raw.map((node) => {
		const t = tIn - ((tIn - tOut) * node.r) / rTotal;
		return { x: node.x, sd: node.sd, t, ps: saturationPressure(t), layer: node.layer };
	});

	return {
		nodes,
		activeCount,
		ventilated,
		sdTotal: sd,
		tSi: nodes[0].t,
		tSe: nodes[nodes.length - 1].t
	};
}

/** Thermal transmittance in W/(m²·K) per EN ISO 6946 (without thermal bridges) */
export function uValue(layers: Layer[]): number {
	const activeCount = activeLayerCount(layers);
	const rse = activeCount < layers.length ? R_SE_U_VENTILATED : R_SE_U;
	let r = R_SI_U + rse;
	for (let i = 0; i < activeCount; i++) r += layers[i].thickness / 1000 / layers[i].lambda;
	return 1 / r;
}

type Point = { sd: number; p: number; node: number };

function cross(o: Point, a: Point, b: Point) {
	return (a.sd - o.sd) * (b.p - o.p) - (a.p - o.p) * (b.sd - o.sd);
}

/**
 * Glaser construction: the actual vapour pressure profile is the "taut string" from inside to outside
 * that never exceeds the saturation pressure – i.e. the lower convex hull.
 */
function vapourHull(nodes: ProfileNode[], pStart: number, pEnd: number, sdTotal: number) {
	const points: Point[] = [{ sd: 0, p: pStart, node: 0 }];
	for (let i = 1; i < nodes.length - 1; i++) {
		const node = nodes[i];
		if (node.sd <= 0 || node.sd >= sdTotal) continue;
		const last = points[points.length - 1];
		if (last.sd === node.sd) {
			if (node.ps < last.p) points[points.length - 1] = { sd: node.sd, p: node.ps, node: i };
			continue;
		}
		points.push({ sd: node.sd, p: node.ps, node: i });
	}
	points.push({ sd: sdTotal, p: pEnd, node: nodes.length - 1 });

	const hull: Point[] = [];
	for (const point of points) {
		while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
			hull.pop();
		}
		hull.push(point);
	}
	return hull;
}

function interpolate(hull: Point[], sd: number): number {
	for (let i = 1; i < hull.length; i++) {
		if (sd <= hull[i].sd) {
			const a = hull[i - 1];
			const b = hull[i];
			return b.sd === a.sd ? b.p : a.p + ((b.p - a.p) * (sd - a.sd)) / (b.sd - a.sd);
		}
	}
	return hull[hull.length - 1].p;
}

export interface Zone {
	/** Start in mm from the inner surface */
	from: number;
	/** End in mm from the inner surface */
	to: number;
	/** Affected layer indices */
	layers: number[];
}

export interface ResultNode extends ProfileNode {
	/** Vapour pressure per Glaser (capped by saturation) in Pa */
	pv: number;
	/** Vapour pressure assuming a purely linear profile (no condensation) in Pa */
	pvLinear: number;
	/** Dew point from the linear vapour pressure profile in °C */
	dewLinear: number;
}

export interface WallResult {
	nodes: ResultNode[];
	activeCount: number;
	ventilated: boolean;
	uValue: number;
	sdTotal: number;
	/** Thickness of the effective layers in mm */
	activeThickness: number;
	/** Total thickness of all layers in mm */
	totalThickness: number;
	/** Boundaries of the effective layers */
	boundaries: ResultNode[];
	pvIn: number;
	pvOut: number;
	tSi: number;
	tSe: number;
	/** Relative humidity at the inner surface in % */
	surfaceRH: number;
	/** Dew point of the indoor air in °C */
	dewPointIn: number;
	/** Position where the wall temperature drops below the indoor dew point */
	dewPlane: { x: number; layer: number } | null;
	/** Condensation zones per Glaser */
	condensation: Zone[];
	/** Condensation rate in g/(m²·h) */
	condensationRate: number;
}

export function analyzeWall(layers: Layer[], climate: Climate): WallResult {
	const profile = buildProfile(layers, climate.tIn, climate.tOut);
	const { nodes, sdTotal, tSi, tSe } = profile;

	const pvIn = (climate.rhIn / 100) * saturationPressure(climate.tIn);
	const pvOut = (climate.rhOut / 100) * saturationPressure(climate.tOut);

	const hasDiffusion = sdTotal > 0;
	const hull = hasDiffusion
		? vapourHull(
				nodes,
				Math.min(pvIn, nodes[0].ps),
				Math.min(pvOut, nodes[nodes.length - 1].ps),
				sdTotal
			)
		: [];

	const resultNodes: ResultNode[] = nodes.map((node) => {
		const pvLinear = hasDiffusion ? pvIn + ((pvOut - pvIn) * node.sd) / sdTotal : pvIn;
		return {
			...node,
			pvLinear,
			pv: hasDiffusion ? interpolate(hull, node.sd) : Math.min(pvIn, node.ps),
			dewLinear: dewPoint(pvLinear)
		};
	});

	// Condensation zones: interior hull vertices touch the saturation curve
	const condensation: Zone[] = [];
	let condensationRate = 0;
	if (hull.length > 2) {
		const touching = hull.slice(1, -1);
		let zoneStart = touching[0];
		let previous = touching[0];
		const pushZone = (start: Point, end: Point) => {
			const affected = new Set<number>();
			for (let i = start.node; i <= end.node; i++) affected.add(nodes[i].layer);
			condensation.push({
				from: nodes[start.node].x,
				to: nodes[end.node].x,
				layers: [...affected]
			});
		};
		for (const point of touching.slice(1)) {
			if (point.node - previous.node > 1) {
				pushZone(zoneStart, previous);
				zoneStart = point;
			}
			previous = point;
		}
		pushZone(zoneStart, previous);

		const [a, b] = hull;
		const [y, z] = hull.slice(-2);
		const fluxIn = (DELTA_AIR * (a.p - b.p)) / (b.sd - a.sd);
		const fluxOut = (DELTA_AIR * (y.p - z.p)) / (z.sd - y.sd);
		condensationRate = Math.max(0, fluxIn - fluxOut) * 1000 * 3600;
	}

	const dewPointIn = dewPoint(pvIn);
	let dewPlane: WallResult['dewPlane'] = null;
	if (tSi <= dewPointIn) {
		dewPlane = { x: 0, layer: 0 };
	} else {
		for (let i = 1; i < nodes.length; i++) {
			const a = nodes[i - 1];
			const b = nodes[i];
			if (b.t <= dewPointIn && a.t > dewPointIn) {
				dewPlane = { x: a.x + ((b.x - a.x) * (a.t - dewPointIn)) / (a.t - b.t), layer: b.layer };
				break;
			}
		}
	}

	const boundaries = resultNodes.filter(
		(node, i) => i === 0 || i === resultNodes.length - 1 || resultNodes[i + 1].layer !== node.layer
	);

	return {
		nodes: resultNodes,
		activeCount: profile.activeCount,
		ventilated: profile.ventilated,
		uValue: uValue(layers),
		sdTotal,
		activeThickness: nodes[nodes.length - 1].x,
		totalThickness: layers.reduce((sum, layer) => sum + layer.thickness, 0),
		boundaries,
		pvIn,
		pvOut,
		tSi,
		tSe,
		surfaceRH: (pvIn / nodes[0].ps) * 100,
		dewPointIn,
		dewPlane,
		condensation,
		condensationRate
	};
}

export interface RhLimits {
	/** Outdoor temperature in °C */
	tOut: number;
	/** Maximum indoor RH without interstitial condensation in % */
	condensation: number;
	/** Maximum indoor RH without surface mould risk in % */
	mould: number;
}

/**
 * Limiting indoor humidities for a given outdoor temperature.
 * Free of condensation as long as the linear vapour pressure profile stays below saturation everywhere.
 */
export function rhLimits(layers: Layer[], tIn: number, tOut: number, rhOut: number): RhLimits {
	const { nodes, sdTotal } = buildProfile(layers, tIn, tOut);
	const psIn = saturationPressure(tIn);
	const pvOut = (rhOut / 100) * saturationPressure(tOut);

	let limit = nodes[0].ps / psIn;
	if (sdTotal > 0) {
		for (const node of nodes) {
			const f = node.sd / sdTotal;
			if (f >= 1) continue;
			limit = Math.min(limit, (node.ps - pvOut * f) / (psIn * (1 - f)));
		}
	}

	return {
		tOut,
		condensation: Math.max(0, limit * 100),
		mould: ((MOULD_RH / 100) * nodes[0].ps * 100) / psIn
	};
}

export function rhLimitCurve(
	layers: Layer[],
	climate: Climate,
	tMin = -30,
	tMax = 20,
	step = 1
): RhLimits[] {
	const curve: RhLimits[] = [];
	for (let t = tMin; t <= tMax + 1e-9; t += step) {
		curve.push(rhLimits(layers, climate.tIn, t, climate.rhOut));
	}
	return curve;
}

export type CriticalTemperature =
	{ kind: 'none' } | { kind: 'always' } | { kind: 'below'; t: number };

/**
 * Outdoor temperature below which condensation (or mould risk) occurs at the current indoor humidity.
 */
export function criticalOutdoorTemperature(
	layers: Layer[],
	climate: Climate,
	criterion: 'condensation' | 'mould',
	tMin = -30
): CriticalTemperature {
	const tMax = climate.tIn - 0.1;
	const limitAt = (t: number) => rhLimits(layers, climate.tIn, t, climate.rhOut)[criterion];

	if (limitAt(tMin) >= climate.rhIn) return { kind: 'none' };
	if (limitAt(tMax) < climate.rhIn) return { kind: 'always' };

	let lo = tMin;
	let hi = tMax;
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2;
		if (limitAt(mid) < climate.rhIn) lo = mid;
		else hi = mid;
	}
	return { kind: 'below', t: (lo + hi) / 2 };
}
