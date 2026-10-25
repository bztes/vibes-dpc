import type { MaterialCategory } from '#lib/physics/types.ts';

interface CategoryStyle {
	label: string;
	fill: string;
	/** Hatch colour */
	ink: string;
	pattern: 'dots' | 'wave' | 'grain' | 'brick' | 'hatch' | 'none' | 'vertical';
}

export const categoryStyles: Record<MaterialCategory, CategoryStyle> = {
	board: { label: 'Boards', fill: '#ecebe8', ink: '#a8a29e', pattern: 'dots' },
	plaster: { label: 'Plasters & renders', fill: '#e2ddd5', ink: '#a8a29e', pattern: 'dots' },
	insulation: { label: 'Insulation', fill: '#f8e3a3', ink: '#c99a1e', pattern: 'wave' },
	masonry: { label: 'Masonry', fill: '#d99a7e', ink: '#a5583a', pattern: 'brick' },
	concrete: { label: 'Concrete', fill: '#c9c6c1', ink: '#8a8580', pattern: 'hatch' },
	wood: { label: 'Timber & wood-based', fill: '#e2b886', ink: '#a8743d', pattern: 'grain' },
	membrane: { label: 'Membranes', fill: '#6d5bd0', ink: '#6d5bd0', pattern: 'none' },
	air: { label: 'Air layers', fill: '#e6f1fb', ink: '#8db8e3', pattern: 'none' },
	cladding: { label: 'Cladding', fill: '#a98467', ink: '#7a5a42', pattern: 'vertical' }
};

export const categoryOrder: MaterialCategory[] = [
	'board',
	'plaster',
	'insulation',
	'wood',
	'membrane',
	'masonry',
	'concrete',
	'air',
	'cladding'
];
