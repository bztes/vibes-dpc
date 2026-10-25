import { eq, inArray } from 'drizzle-orm';
import type { Material } from '#lib/physics/types.ts';
import type { db as Database } from './index';
import { assembly, assemblyLayer, material } from './schema';

// Typical design values per EN ISO 10456 or common manufacturer data.
// μ is a single design value; where a range exists, the value less favourable for condensation was chosen.
export const materials: Material[] = [
	// Boards & plasters
	{
		id: 'plasterboard',
		name: 'Gypsum plasterboard',
		category: 'board',
		lambda: 0.25,
		mu: 8,
		thickness: 12.5
	},
	{
		id: 'gypsum-fibre',
		name: 'Gypsum fibreboard',
		category: 'board',
		lambda: 0.32,
		mu: 13,
		thickness: 12.5
	},
	{ id: 'osb', name: 'OSB/3 board', category: 'wood', lambda: 0.13, mu: 200, thickness: 15 },
	{ id: 'mdf', name: 'MDF board', category: 'wood', lambda: 0.14, mu: 11, thickness: 16 },
	{
		id: 'lime-cement-plaster',
		name: 'Lime-cement plaster',
		category: 'plaster',
		lambda: 1.0,
		mu: 20,
		thickness: 15
	},
	{
		id: 'render',
		name: 'Mineral render (exterior)',
		category: 'plaster',
		lambda: 0.87,
		mu: 20,
		thickness: 20
	},

	// Insulation
	{
		id: 'mineral-wool',
		name: 'Mineral wool 035',
		category: 'insulation',
		lambda: 0.035,
		mu: 1,
		thickness: 160
	},
	{
		id: 'cellulose',
		name: 'Cellulose (blown-in)',
		category: 'insulation',
		lambda: 0.039,
		mu: 2,
		thickness: 200
	},
	{
		id: 'wood-fibre-flex',
		name: 'Wood fibre batts',
		category: 'insulation',
		lambda: 0.038,
		mu: 2,
		thickness: 160
	},
	{
		id: 'wood-fibre-board',
		name: 'Wood fibre insulation board',
		category: 'insulation',
		lambda: 0.045,
		mu: 5,
		thickness: 60
	},
	{
		id: 'eps',
		name: 'EPS 035 (polystyrene)',
		category: 'insulation',
		lambda: 0.035,
		mu: 60,
		thickness: 140
	},

	// Masonry & concrete
	{
		id: 'solid-brick',
		name: 'Solid brick',
		category: 'masonry',
		lambda: 0.68,
		mu: 10,
		thickness: 365
	},
	{
		id: 'aerated-concrete',
		name: 'Aerated concrete',
		category: 'masonry',
		lambda: 0.12,
		mu: 10,
		thickness: 300
	},
	{
		id: 'concrete',
		name: 'Reinforced concrete',
		category: 'concrete',
		lambda: 2.3,
		mu: 130,
		thickness: 200
	},

	// Timber
	{
		id: 'timber',
		name: 'Structural timber',
		category: 'wood',
		lambda: 0.13,
		mu: 50,
		thickness: 160
	},
	{
		id: 'timber-cladding',
		name: 'Timber cladding / boards',
		category: 'cladding',
		lambda: 0.13,
		mu: 50,
		thickness: 22
	},
	{
		id: 'wind-barrier-board',
		name: 'Gypsum wind barrier board',
		category: 'board',
		lambda: 0.25,
		mu: 6,
		thickness: 9
	},
	{
		id: 'bitumen-fibreboard',
		name: 'Bitumen-impregnated fibreboard',
		category: 'wood',
		lambda: 0.05,
		mu: 12,
		thickness: 12
	},

	// Membranes (μ derived from sd value / thickness)
	{
		id: 'pe-foil',
		name: 'PE vapour barrier (sd 100 m)',
		category: 'membrane',
		lambda: 0.4,
		mu: 500000,
		thickness: 0.2
	},
	{
		id: 'smart-membrane',
		name: 'Smart vapour retarder (sd 2 m)',
		category: 'membrane',
		lambda: 0.2,
		mu: 10000,
		thickness: 0.2
	},
	{
		id: 'vapour-paper',
		name: 'Vapour retarder paper (sd 2.3 m)',
		category: 'membrane',
		lambda: 0.17,
		mu: 7700,
		thickness: 0.3
	},
	{
		id: 'breather-membrane',
		name: 'Breather membrane (sd 0.02 m)',
		category: 'membrane',
		lambda: 0.2,
		mu: 40,
		thickness: 0.5
	},

	// Air layers
	{
		id: 'air',
		name: 'Unventilated air layer',
		category: 'air',
		lambda: 0.23,
		mu: 1,
		thickness: 40,
		note: 'Equivalent conductivity for 20–50 mm'
	},
	{
		id: 'ventilation-gap',
		name: 'Ventilation gap',
		category: 'air',
		lambda: 0.23,
		mu: 1,
		thickness: 30,
		ventilated: true,
		note: 'Ventilated air layer – layers outside of it are ignored'
	},

	// Cladding
	{
		id: 'fibre-cement',
		name: 'Fibre cement panel',
		category: 'cladding',
		lambda: 0.58,
		mu: 100,
		thickness: 8
	},
	{
		id: 'brick-veneer',
		name: 'Brick veneer',
		category: 'cladding',
		lambda: 0.96,
		mu: 100,
		thickness: 115
	}
];

interface AssemblySeed {
	name: string;
	description: string;
	keywords: string[];
	/** `lambda` and `mu` override the material's values */
	layers: { material: string; thickness?: number; name?: string; lambda?: number; mu?: number }[];
}

// Exterior walls of typical Swedish houses, oldest first, layers from inside to outside
export const assemblies: AssemblySeed[] = [
	{
		name: 'Swedish log house (before 1900)',
		description:
			'Traditional timmerhus: uninsulated log wall with interior boards, tarred building paper and board-and-batten cladding.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'timber-cladding', thickness: 22, name: 'Interior boards with wallpaper' },
			{ material: 'timber', thickness: 150, name: 'Log wall (timmerstomme)' },
			{ material: 'vapour-paper', name: 'Tarred building paper (tjärpapp)' },
			{ material: 'ventilation-gap', thickness: 20, name: 'Gap behind battens' },
			{ material: 'timber-cladding', thickness: 22, name: 'Board-and-batten (lockpanel)' }
		]
	},
	{
		name: 'Swedish plank frame house (1900–1930)',
		description:
			'Turn-of-the-century house (sekelskifte): vertical plank frame wrapped in building paper on both sides, with standing wood panel outside.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'timber-cladding', thickness: 22, name: 'Interior boards with wallpaper' },
			{ material: 'vapour-paper', name: 'Building paper (byggpapp)' },
			{ material: 'timber', thickness: 75, name: 'Plank frame (plankstomme)' },
			{ material: 'vapour-paper', name: 'Building paper (byggpapp)' },
			{ material: 'ventilation-gap', thickness: 20, name: 'Gap behind battens' },
			{ material: 'timber-cladding', thickness: 22, name: 'Standing panel (stående panel)' }
		]
	},
	{
		name: 'Swedish functionalist house (1930–1945)',
		description:
			'Funkis house: timber frame insulated with wood shavings, soft fibreboard inside and asphalt-impregnated board outside.',
		keywords: ['Sweden'],
		layers: [
			{
				material: 'wood-fibre-board',
				thickness: 12,
				name: 'Soft fibreboard (porös board)',
				lambda: 0.05
			},
			{ material: 'vapour-paper', name: 'Building paper (byggpapp)' },
			{
				material: 'wood-fibre-flex',
				thickness: 100,
				name: 'Wood shavings between studs (kutterspån)',
				lambda: 0.08
			},
			{ material: 'bitumen-fibreboard', name: 'Asphalt-impregnated board' },
			{ material: 'ventilation-gap', thickness: 22 },
			{ material: 'timber-cladding', name: 'Wood panel (träpanel)' }
		]
	},
	{
		name: 'Swedish folkhem villa (1945–1960)',
		description:
			'Post-war småhus: timber frame with early mineral wool, hardboard inside, asphalt paper as vapour retarder and wood panel outside.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'mdf', thickness: 6, name: 'Hardboard (masonit)' },
			{ material: 'vapour-paper', name: 'Asphalt paper (asfaltpapp)' },
			{
				material: 'mineral-wool',
				thickness: 95,
				name: 'Early mineral wool between studs',
				lambda: 0.045
			},
			{ material: 'bitumen-fibreboard', name: 'Asphalt-impregnated board' },
			{ material: 'ventilation-gap', thickness: 22 },
			{ material: 'timber-cladding', name: 'Wood panel (träpanel)' }
		]
	},
	{
		name: 'Swedish aerated concrete house (1955–1975)',
		description:
			'Single-leaf wall of autoclaved aerated concrete (lättbetong, Siporex/Ytong) with plaster inside and mineral render outside.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'lime-cement-plaster', thickness: 10, name: 'Interior plaster' },
			{ material: 'aerated-concrete', thickness: 250, lambda: 0.14 },
			{ material: 'render', thickness: 20, name: 'Mineral render (puts)' }
		]
	},
	{
		name: 'Swedish record-years brick villa (1965–1975)',
		description:
			'Rekordåren småhus with tegelfasad: plasterboard, PE foil and mineral-wool insulated timber frame behind a brick veneer.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'plasterboard', thickness: 13 },
			{ material: 'pe-foil' },
			{ material: 'mineral-wool', thickness: 120, lambda: 0.04 },
			{ material: 'bitumen-fibreboard', name: 'Asphalt-impregnated board' },
			{ material: 'ventilation-gap', thickness: 30, name: 'Air gap behind brick' },
			{ material: 'brick-veneer', thickness: 120, name: 'Brick veneer (fasadtegel)' }
		]
	},
	{
		name: 'Swedish energy-crisis house (1975–1990)',
		description:
			'SBN 75/80 house built after the oil crisis: 145 mm timber frame plus horizontal outer studs, PE foil and wind barrier board.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'plasterboard', thickness: 13 },
			{ material: 'pe-foil' },
			{ material: 'mineral-wool', thickness: 145, lambda: 0.037 },
			{
				material: 'mineral-wool',
				thickness: 45,
				name: 'Horizontal studs with mineral wool',
				lambda: 0.037
			},
			{ material: 'wind-barrier-board' },
			{ material: 'ventilation-gap', thickness: 28 },
			{ material: 'timber-cladding', name: 'Wood panel (träpanel)' }
		]
	},
	{
		name: 'Swedish 1970s house, insulated outside',
		description:
			'Common retrofit (tilläggsisolering): a 1970s timber frame wall with an extra 70 mm of mineral wool and new wind barrier and panel outside.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'plasterboard', thickness: 13 },
			{ material: 'pe-foil' },
			{ material: 'mineral-wool', thickness: 120, lambda: 0.04 },
			{ material: 'bitumen-fibreboard', name: 'Old asphalt-impregnated board' },
			{
				material: 'mineral-wool',
				thickness: 70,
				name: 'Added insulation (tilläggsisolering)',
				lambda: 0.04
			},
			{ material: 'wind-barrier-board' },
			{ material: 'ventilation-gap', thickness: 28 },
			{ material: 'timber-cladding', name: 'New wood panel (träpanel)' }
		]
	},
	{
		name: 'Modern Swedish house (BBR)',
		description:
			'Current timber frame wall (regelvägg) with the vapour barrier protected behind an insulated service layer.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'plasterboard', thickness: 13 },
			{ material: 'mineral-wool', thickness: 45, name: 'Service layer (mineral wool)' },
			{ material: 'pe-foil' },
			{ material: 'mineral-wool', thickness: 195 },
			{ material: 'wind-barrier-board' },
			{ material: 'ventilation-gap', thickness: 28 },
			{ material: 'timber-cladding', name: 'Wood panel (träpanel)' }
		]
	},
	{
		name: 'Swedish low-energy eco house',
		description:
			'Diffusion-open passive-house style wall: cellulose between I-joists, smart vapour retarder and wood fibre board as wind barrier.',
		keywords: ['Sweden'],
		layers: [
			{ material: 'gypsum-fibre', thickness: 15 },
			{ material: 'wood-fibre-flex', thickness: 45, name: 'Service layer (wood fibre)' },
			{ material: 'smart-membrane' },
			{ material: 'cellulose', thickness: 300, name: 'Cellulose between I-joists' },
			{ material: 'wood-fibre-board', thickness: 35, name: 'Wood fibre wind barrier board' },
			{ material: 'ventilation-gap', thickness: 28 },
			{ material: 'timber-cladding', name: 'Wood panel (träpanel)' }
		]
	}
];

/**
 * Bump to roll out changed defaults: missing materials are added and the built-in templates
 * are replaced. The applied version is stored in SQLite's `user_version`.
 */
const SEED_VERSION = 6;

/** Built-in materials dropped from the catalogue; layers keep their own values */
const retiredMaterials = [
	'chipboard',
	'lime-plaster',
	'clay-plaster',
	'silicone-render',
	'stone-wool',
	'hemp',
	'xps',
	'pir',
	'blown-mineral-wool',
	'calcium-silicate',
	'perforated-brick',
	'sand-lime',
	'leca',
	'clt',
	'plywood',
	'bitumen-membrane',
	'service-void',
	'hpl',
	'roof-tiles',
	'turf'
];

/** Brings the default material catalogue and built-in templates up to date */
export function seed(db: typeof Database) {
	const version = db.$client.pragma('user_version', { simple: true }) as number;
	if (version >= SEED_VERSION) return;

	db.transaction((tx) => {
		tx.delete(material).where(inArray(material.id, retiredMaterials)).run();
		tx.insert(material).values(materials).onConflictDoNothing().run();
		tx.delete(assembly).where(eq(assembly.builtIn, true)).run();

		const byId = new Map(materials.map((m) => [m.id, m]));
		for (const seed of assemblies) {
			const [{ id }] = tx
				.insert(assembly)
				.values({
					name: seed.name,
					description: seed.description,
					keywords: seed.keywords,
					builtIn: true
				})
				.returning({ id: assembly.id })
				.all();
			tx.insert(assemblyLayer)
				.values(
					seed.layers.map((layer, position) => {
						const m = byId.get(layer.material)!;
						return {
							assemblyId: id,
							position,
							materialId: m.id,
							name: layer.name ?? m.name,
							category: m.category,
							lambda: layer.lambda ?? m.lambda,
							mu: layer.mu ?? m.mu,
							thickness: layer.thickness ?? m.thickness,
							ventilated: m.ventilated ?? false
						};
					})
				)
				.run();
		}
	});
	db.$client.pragma(`user_version = ${SEED_VERSION}`);
}
