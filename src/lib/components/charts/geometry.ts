import type { Layer } from '#lib/physics/types.ts';

export function linear(domain: [number, number], range: [number, number]) {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	const scale = (value: number) => r0 + ((value - d0) / (d1 - d0 || 1)) * (r1 - r0);
	scale.invert = (px: number) => d0 + ((px - r0) / (r1 - r0 || 1)) * (d1 - d0);
	return scale;
}

/** "Nice" axis ticks */
export function ticks(min: number, max: number, count = 5): number[] {
	const span = max - min;
	if (span <= 0) return [min];
	const raw = span / count;
	const magnitude = 10 ** Math.floor(Math.log10(raw));
	const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= raw) ?? raw;
	const result: number[] = [];
	for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) {
		result.push(Math.round(v / step) * step);
	}
	return result;
}

export interface Band {
	layer: Layer;
	index: number;
	/** Pixel position & width */
	x: number;
	width: number;
	/** Position in mm from the inner surface */
	start: number;
	end: number;
}

/**
 * Distributes layers across the available width proportionally to their thickness;
 * very thin layers (membranes) get a minimum width.
 */
export function layerBands(layers: Layer[], x0: number, width: number): Band[] {
	const minWidth = (layer: Layer) => (layer.category === 'membrane' ? 5 : 14);
	const total = layers.reduce((sum, layer) => sum + layer.thickness, 0) || 1;

	let scale = width / total;
	for (let iteration = 0; iteration < 6; iteration++) {
		let fixedWidth = 0;
		let flexibleThickness = 0;
		for (const layer of layers) {
			if (layer.thickness * scale < minWidth(layer)) fixedWidth += minWidth(layer);
			else flexibleThickness += layer.thickness;
		}
		if (flexibleThickness === 0) break;
		scale = Math.max(0, width - fixedWidth) / flexibleThickness;
	}

	const bands: Band[] = [];
	let x = x0;
	let mm = 0;
	layers.forEach((layer, index) => {
		const w = Math.max(minWidth(layer), layer.thickness * scale);
		bands.push({ layer, index, x, width: w, start: mm, end: mm + layer.thickness });
		x += w;
		mm += layer.thickness;
	});

	// Normalise to the exact total width
	const factor = width / (x - x0 || 1);
	for (const band of bands) {
		band.x = x0 + (band.x - x0) * factor;
		band.width *= factor;
	}
	return bands;
}

/** Position in mm → pixels, piecewise linear across the layer bands */
export function mmToPx(bands: Band[], mm: number): number {
	if (bands.length === 0) return 0;
	for (const band of bands) {
		if (mm <= band.end) {
			const f = band.end === band.start ? 1 : (mm - band.start) / (band.end - band.start);
			return band.x + Math.max(0, f) * band.width;
		}
	}
	const last = bands[bands.length - 1];
	return last.x + last.width;
}

/** Positions of the layer number markers; narrow layers move to a second row */
export function bandMarkers(bands: Band[], baseline: number, rowHeight = 22) {
	let lastX = -Infinity;
	let lastRow = 1;
	return bands.map((band) => {
		const cx = band.x + band.width / 2;
		const row = cx - lastX < rowHeight && lastRow === 0 ? 1 : 0;
		lastX = cx;
		lastRow = row;
		return { cx, cy: baseline - row * rowHeight };
	});
}

export function pathFrom(points: [number, number][]): string {
	return points
		.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
		.join('');
}
