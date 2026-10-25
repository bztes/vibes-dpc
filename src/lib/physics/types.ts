export const materialCategories = [
	'board',
	'plaster',
	'insulation',
	'masonry',
	'concrete',
	'wood',
	'membrane',
	'air',
	'cladding'
] as const;

export type MaterialCategory = (typeof materialCategories)[number];

export interface Material {
	id: string;
	name: string;
	category: MaterialCategory;
	/** Thermal conductivity λ in W/(m·K) */
	lambda: number;
	/** Water vapour diffusion resistance factor μ (dimensionless) */
	mu: number;
	/** Default thickness in mm */
	thickness: number;
	/** Ventilated air layer: this and all following layers are ignored thermally and for diffusion */
	ventilated?: boolean;
	note?: string | null;
}

export interface Layer {
	id: string;
	/** ID of the catalogue material this layer was created from */
	material?: string;
	name: string;
	category: MaterialCategory;
	lambda: number;
	mu: number;
	/** Thickness in mm */
	thickness: number;
	ventilated?: boolean;
	/** Deactivated layers stay in the build-up but are left out of the calculation */
	disabled?: boolean;
}

export type AssemblyLayer = Omit<Layer, 'id'>;

/** A saved build-up */
export interface Assembly {
	id: string;
	name: string;
	description: string;
	/** Tags, e.g. the era or region where this build-up is common */
	keywords: string[];
	builtIn: boolean;
	/** From inside to outside */
	layers: AssemblyLayer[];
}

export interface Catalog {
	materials: Material[];
	assemblies: Assembly[];
}

export interface Climate {
	/** Indoor temperature in °C */
	tIn: number;
	/** Indoor relative humidity in % */
	rhIn: number;
	/** Outdoor temperature in °C */
	tOut: number;
	/** Outdoor relative humidity in % */
	rhOut: number;
}
