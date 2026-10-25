import { describe, expect, it } from 'vitest';
import {
	analyzeWall,
	criticalOutdoorTemperature,
	dewPoint,
	indoorHumidity,
	rhLimits,
	saturationPressure,
	uValue
} from './glaser';
import type { Climate, Layer } from './types';

const layer = (
	name: string,
	thickness: number,
	lambda: number,
	mu: number,
	ventilated = false
): Layer => ({
	id: name,
	name,
	category: 'board',
	thickness,
	lambda,
	mu,
	ventilated
});

const winter: Climate = { tIn: 20, rhIn: 50, tOut: -5, rhOut: 80 };

describe('moisture basics', () => {
	it('computes saturation pressure per EN ISO 13788', () => {
		expect(saturationPressure(20)).toBeCloseTo(2337, -1);
		expect(saturationPressure(0)).toBeCloseTo(610.5, 1);
		expect(saturationPressure(-5)).toBeCloseTo(401, -1);
	});

	it('dew point is the inverse of saturation pressure', () => {
		for (const t of [-15, -2, 0, 9.3, 25])
			expect(dewPoint(saturationPressure(t))).toBeCloseTo(t, 6);
		expect(dewPoint(0.5 * saturationPressure(20))).toBeCloseTo(9.3, 1);
	});
});

describe('analyzeWall', () => {
	const timberFrame = [
		layer('Plasterboard', 12.5, 0.25, 8),
		layer('OSB', 15, 0.13, 200),
		layer('Mineral wool', 200, 0.035, 1),
		layer('Wood fibre', 60, 0.045, 5),
		layer('Ventilation gap', 30, 0.23, 1, true),
		layer('Cladding', 22, 0.13, 50)
	];

	it('ignores layers from the ventilation gap outwards', () => {
		const result = analyzeWall(timberFrame, winter);
		expect(result.activeCount).toBe(4);
		expect(result.activeThickness).toBeCloseTo(287.5);
		expect(result.sdTotal).toBeCloseTo(0.1 + 3 + 0.2 + 0.3, 6);
		expect(uValue(timberFrame)).toBeCloseTo(1 / (0.13 + 0.05 + 0.1154 + 5.714 + 1.333 + 0.13), 2);
	});

	it('treats a vapour-open build-up as condensation-free', () => {
		const result = analyzeWall(timberFrame, winter);
		expect(result.condensation).toEqual([]);
		expect(result.condensationRate).toBe(0);
		// The indoor dew point is still reached inside the insulation
		expect(result.dewPlane?.layer).toBe(2);
	});

	it('finds condensation in front of a vapour-tight layer on the cold side', () => {
		const wrong = [
			layer('Plasterboard', 12.5, 0.25, 8),
			layer('Mineral wool', 200, 0.035, 1),
			layer('OSB', 15, 0.13, 200),
			layer('Ventilation gap', 30, 0.23, 1, true)
		];
		const result = analyzeWall(wrong, winter);
		expect(result.condensation).toHaveLength(1);
		expect(result.condensation[0].from).toBeCloseTo(212.5, 0);
		expect(result.condensationRate).toBeGreaterThan(0);
		for (const node of result.nodes) expect(node.pv).toBeLessThanOrEqual(node.ps + 1e-6);
	});

	it('reports surface mould risk for poorly insulated walls', () => {
		const brick = [layer('Brick', 240, 0.68, 10)];
		const result = analyzeWall(brick, { ...winter, rhIn: 60 });
		expect(result.surfaceRH).toBeGreaterThan(80);
	});
});

describe('humidity limits', () => {
	const internalInsulation = [
		layer('Plasterboard', 12.5, 0.25, 8),
		layer('Mineral wool', 80, 0.035, 1),
		layer('Brick', 365, 0.68, 10)
	];

	it('limit rises with outdoor temperature', () => {
		const cold = rhLimits(internalInsulation, 20, -10, 80);
		const mild = rhLimits(internalInsulation, 20, 5, 80);
		expect(mild.condensation).toBeGreaterThan(cold.condensation);
		expect(mild.mould).toBeGreaterThan(cold.mould);
	});

	it('critical outdoor temperature matches the humidity limit', () => {
		const climate = { ...winter, rhIn: 50 };
		const critical = criticalOutdoorTemperature(internalInsulation, climate, 'condensation');
		expect(critical.kind).toBe('below');
		if (critical.kind !== 'below') return;
		expect(rhLimits(internalInsulation, 20, critical.t, 80).condensation).toBeCloseTo(50, 1);
		expect(
			analyzeWall(internalInsulation, { ...climate, tOut: critical.t - 1 }).condensation.length
		).toBeGreaterThan(0);
		expect(
			analyzeWall(internalInsulation, { ...climate, tOut: critical.t + 1 }).condensation
		).toEqual([]);
	});
});

describe('indoorHumidity', () => {
	it('adds the vapour excess of the humidity class in cold weather', () => {
		expect(indoorHumidity(20, -10, 80, 2)).toBeCloseTo(33, 0);
		expect(indoorHumidity(20, -10, 80, 3)).toBeGreaterThan(indoorHumidity(20, -10, 80, 2));
	});

	it('equals the outdoor humidity without excess at the same temperature', () => {
		expect(indoorHumidity(20, 20, 60, 5)).toBeCloseTo(60, 5);
	});
});
