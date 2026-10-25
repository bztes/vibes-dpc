import { createContext } from 'svelte';
import {
	analyzeWall,
	criticalOutdoorTemperature,
	indoorHumidity,
	type HumidityClass,
	rhLimitCurve,
	rhLimits
} from '#lib/physics/glaser.ts';
import type {
	Assembly,
	AssemblyLayer,
	Catalog,
	Climate,
	Layer,
	Material
} from '#lib/physics/types.ts';

/** localStorage key for the user's configs; they used to be stored as templates */
const CONFIGS_KEY = 'dpc:configs';
const LEGACY_CONFIGS_KEY = 'dpc:templates';

function read<T>(key: string): T | undefined {
	try {
		return JSON.parse(localStorage.getItem(key) ?? 'null') ?? undefined;
	} catch {
		return undefined;
	}
}

/** A template from the catalogue or, if `config`, one of the user's configs */
export type Template = Assembly & { config?: boolean };

/** The user's configs, saved in this browser */
export const readConfigs = (): Assembly[] =>
	(
		read<Partial<Assembly>[]>(CONFIGS_KEY) ??
		read<Partial<Assembly>[]>(LEGACY_CONFIGS_KEY) ??
		[]
	).map((c) => ({ keywords: [], ...c }) as Assembly);

let nextId = 0;

function createLayer(values: AssemblyLayer): Layer {
	return { id: `layer-${nextId++}`, ...values };
}

function fromMaterial(material: Material, thickness = material.thickness): Layer {
	return createLayer({
		material: material.id,
		name: material.name,
		category: material.category,
		lambda: material.lambda,
		mu: material.mu,
		thickness,
		ventilated: material.ventilated
	});
}

/** Layer values without the client-side id */
const strip = (layers: Layer[]): AssemblyLayer[] =>
	layers.map(({ material, name, category, lambda, mu, thickness, ventilated, disabled }) => ({
		material,
		name,
		category,
		lambda,
		mu,
		thickness,
		ventilated: !!ventilated,
		disabled: !!disabled
	}));

/** Default winter design climate */
export const DEFAULT_CLIMATE: Climate = { tIn: 20, rhIn: 50, tOut: -5, rhOut: 80 };

/** Typical outdoor conditions, from summer heat to deep winter */
export const CLIMATE_PRESETS = {
	hot: { label: 'Hot', tOut: 30, rhOut: 60 },
	warm: { label: 'Warm', tOut: 15, rhOut: 75 },
	mild: { label: 'Mild', tOut: 0, rhOut: 85 },
	cold: { label: 'Cold', tOut: -10, rhOut: 80 },
	freezing: { label: 'Freezing', tOut: -20, rhOut: 80 }
} as const;

export type ClimatePreset = keyof typeof CLIMATE_PRESETS;

export class WallModel {
	layers = $state<Layer[]>([]);
	/** Climate as entered; `rhIn` is ignored while the indoor humidity is automatic */
	climateInput = $state<Climate>({ ...DEFAULT_CLIMATE });
	/** Derive the indoor humidity from the outdoor climate using this humidity class */
	humidityClass = $state<HumidityClass | undefined>(2);
	climate = $derived.by((): Climate => {
		const input = this.climateInput;
		if (!this.humidityClass) return input;
		return {
			...input,
			rhIn: indoorHumidity(input.tIn, input.tOut, input.rhOut, this.humidityClass)
		};
	});
	/** Climate preset matching the outdoor climate, if any */
	climatePreset = $derived(
		(Object.keys(CLIMATE_PRESETS) as ClimatePreset[]).find(
			(key) =>
				CLIMATE_PRESETS[key].tOut === this.climateInput.tOut &&
				CLIMATE_PRESETS[key].rhOut === this.climateInput.rhOut
		)
	);
	/** Template the current build-up was loaded from */
	templateId = $state('');

	#catalog: () => Catalog;
	materials = $derived.by(() => this.#catalog().materials);
	/** The user's configs, saved in this browser */
	configs = $state<Assembly[]>([]);
	templates = $derived.by((): Template[] => [
		...this.#catalog().assemblies,
		...this.configs.map((c) => ({ ...c, config: true }))
	]);
	template = $derived(this.templates.find((t) => t.id === this.templateId));
	/** True if the build-up differs from the loaded template */
	modified = $derived(
		!this.template ||
			JSON.stringify(strip(this.layers)) !==
				JSON.stringify(strip(this.template.layers.map(createLayer)))
	);

	/** Layers that take part in the calculation; results refer to their positions */
	activeLayers = $derived(this.layers.filter((layer) => !layer.disabled));
	result = $derived(analyzeWall(this.activeLayers, this.climate));
	limitCurve = $derived(rhLimitCurve(this.activeLayers, this.climate));
	currentLimits = $derived(
		rhLimits(this.activeLayers, this.climate.tIn, this.climate.tOut, this.climate.rhOut)
	);
	criticalCondensation = $derived(
		criticalOutdoorTemperature(this.activeLayers, this.climate, 'condensation')
	);
	criticalMould = $derived(criticalOutdoorTemperature(this.activeLayers, this.climate, 'mould'));

	/** Starts with the template `templateId` or, without it, an empty build-up */
	constructor(catalog: () => Catalog, templateId?: string) {
		this.#catalog = catalog;
		if (templateId) this.loadTemplate(templateId);
	}

	/** Number (from 1) in the build-up of the active layer at `index` */
	layerNumber = (index: number) => this.layers.indexOf(this.activeLayers[index]) + 1;

	material(id: string) {
		return this.materials.find((material) => material.id === id);
	}

	loadTemplate(id: string) {
		const template = this.templates.find((t) => t.id === id);
		if (!template) return;
		this.templateId = id;
		this.layers = template.layers.map(createLayer);
	}

	addLayer(materialId: string) {
		const material = this.material(materialId);
		if (material) this.layers.push(fromMaterial(material));
	}

	/** Swaps the material of a layer but keeps its thickness */
	replaceMaterial(index: number, materialId: string) {
		const material = this.material(materialId);
		if (material) this.layers[index] = fromMaterial(material, this.layers[index].thickness);
	}

	toggleLayer(index: number) {
		this.layers[index].disabled = !this.layers[index].disabled;
	}

	removeLayer(index: number) {
		this.layers.splice(index, 1);
	}

	moveLayer(index: number, direction: -1 | 1) {
		this.moveLayerTo(index, index + direction);
	}

	/** Moves a layer so that it ends up at position `target` */
	moveLayerTo(index: number, target: number) {
		if (target < 0 || target >= this.layers.length || target === index) return;
		const [layer] = this.layers.splice(index, 1);
		this.layers.splice(target, 0, layer);
	}

	/** Inserts a copy of a layer directly after it */
	duplicateLayer(index: number) {
		const [values] = strip([$state.snapshot(this.layers[index])]);
		this.layers.splice(index + 1, 0, createLayer(values));
	}

	/** Starts over with no layers */
	clear() {
		this.templateId = '';
		this.layers = [];
	}

	/** Layers without client-side ids, ready to be stored as a template */
	snapshot(): AssemblyLayer[] {
		return strip($state.snapshot(this.layers));
	}

	/** Reads the user's configs and loads the start template if it is one of them */
	restore(templateId?: string) {
		this.configs = readConfigs();
		// Configs aren't known during server rendering
		if (templateId) this.loadTemplate(templateId);
	}

	/** Stores the current build-up as a config, updating the config with `id` if given */
	saveConfig({
		id,
		name,
		description,
		keywords
	}: {
		id?: string;
		name: string;
		description: string;
		keywords: string[];
	}) {
		const config: Assembly = {
			id: id ?? crypto.randomUUID(),
			name,
			description,
			keywords,
			builtIn: false,
			layers: this.snapshot()
		};
		const index = this.configs.findIndex((c) => c.id === config.id);
		if (index >= 0) this.configs[index] = config;
		else this.configs.push(config);
		this.#persist();
		return config.id;
	}

	/** Changes name, description or tags of a config but keeps its layers */
	updateConfigDetails(
		id: string,
		details: Partial<Pick<Assembly, 'name' | 'description' | 'keywords'>>
	) {
		const config = this.configs.find((c) => c.id === id);
		if (!config) return;
		Object.assign(config, details);
		this.#persist();
	}

	deleteConfig(id: string) {
		this.configs = this.configs.filter((c) => c.id !== id);
		this.#persist();
	}

	#persist() {
		localStorage.setItem(CONFIGS_KEY, JSON.stringify($state.snapshot(this.configs)));
		localStorage.removeItem(LEGACY_CONFIGS_KEY);
	}

	applyClimatePreset(key: ClimatePreset) {
		const { tOut, rhOut } = CLIMATE_PRESETS[key];
		Object.assign(this.climateInput, { tOut, rhOut });
	}

	/** Switches the automatic indoor humidity; the manual value continues from the automatic one */
	setHumidityClass(humidityClass: HumidityClass | undefined) {
		if (!humidityClass) this.climateInput.rhIn = Math.round(this.climate.rhIn);
		this.humidityClass = humidityClass;
	}
}

export const [getWall, setWall] = createContext<WallModel>();
