import { createContext } from 'svelte';
import { resolve } from '$app/paths';
import { getVerdict } from '#lib/verdict.ts';
import {
	createConfig,
	deleteConfig,
	getConfigs,
	importConfigs,
	updateConfig
} from '#lib/configs.remote.ts';
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

/**
 * A template from the catalogue or, if `config`, one of the user's configs; `local` if that is
 * saved in this browser rather than the user's account
 */
export type Template = Assembly & { config?: boolean; local?: boolean };

/**
 * URL of a template: catalogue templates and configs in the user's account at `/[id]`, configs from
 * this browser's localStorage at `/local/[id]`. Without a template: an empty build-up
 */
export const templatePath = (template?: Pick<Template, 'id' | 'local'>) =>
	template?.local
		? resolve('/(calculator)/local/[id]', { id: template.id })
		: resolve('/(calculator)/[[id]]', template ? { id: template.id } : {});

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

/** A new layer with the values of a catalogue material */
export function fromMaterial(material: Material, thickness = material.thickness): Layer {
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

export const CLIMATE_PRESETS = {
	warm: { label: 'Warm', tOut: 25, rhOut: 60 },
	mild: { label: 'Mild', tOut: 15, rhOut: 75 },
	cool: { label: 'Cool', tOut: 5, rhOut: 85 },
	frost: { label: 'Frost', tOut: 0, rhOut: 85 },
	cold: { label: 'Cold', tOut: -5, rhOut: 80 },
	freezing: { label: 'Freezing', tOut: -15, rhOut: 80 }
} as const;

export type ClimatePreset = keyof typeof CLIMATE_PRESETS;

/** Default winter design climate: the cold preset */
export const DEFAULT_CLIMATE: Climate = {
	tIn: 20,
	rhIn: 50,
	tOut: CLIMATE_PRESETS.cold.tOut,
	rhOut: CLIMATE_PRESETS.cold.rhOut
};

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
	/** The signed-in user's configs from the database; `null` when signed out */
	#account: () => Assembly[] | null;
	/** Configs saved in this browser, used while signed out */
	#local = $state<Assembly[]>([]);
	/** True if configs are stored in the user's account rather than this browser */
	signedIn = $derived.by(() => !!this.#account());
	/**
	 * The user's configs. Changes are shown straight away, until the account's configs come back
	 * from the server
	 */
	configs = $derived.by(() => this.#account() ?? this.#local);
	templates = $derived.by((): Template[] => [
		...this.#catalog().assemblies,
		...this.configs.map((c) => ({ ...c, config: true, local: !this.signedIn }))
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
	verdict = $derived(getVerdict(this));
	limitCurve = $derived(rhLimitCurve(this.activeLayers, this.climate));
	currentLimits = $derived(
		rhLimits(this.activeLayers, this.climate.tIn, this.climate.tOut, this.climate.rhOut)
	);
	criticalCondensation = $derived(
		criticalOutdoorTemperature(this.activeLayers, this.climate, 'condensation')
	);
	criticalMould = $derived(criticalOutdoorTemperature(this.activeLayers, this.climate, 'mould'));

	/** Starts with the template `templateId` or, without it, an empty build-up */
	constructor(catalog: () => Catalog, account: () => Assembly[] | null, templateId?: string) {
		this.#catalog = catalog;
		this.#account = account;
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

	/** Inserts a layer before `index`, by default on the outside */
	addLayer(layer: Layer, index = this.layers.length) {
		this.layers.splice(index, 0, layer);
	}

	/** Swaps the material of a layer but keeps its thickness */
	replaceMaterial(index: number, materialId: string) {
		const material = this.material(materialId);
		if (!material) return;
		const { id, thickness } = this.layers[index];
		this.layers[index] = { ...fromMaterial(material, thickness), id };
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

	/**
	 * Reads the configs saved in this browser and loads the start template if it is one of them.
	 * Signed in, they are moved to the user's account
	 */
	restore(templateId?: string) {
		const local = readConfigs();
		if (this.signedIn) {
			if (local.length) void this.#import(local);
		} else {
			this.#local = local;
		}
		// Browser configs aren't known during server rendering
		if (templateId) this.loadTemplate(templateId);
	}

	/** Uploads the browser's configs to the user's account, where they get new ids */
	async #import(local: Assembly[]) {
		this.configs = [...this.configs, ...local];
		try {
			await importConfigs(local.map(toInput));
		} catch {
			// They stay in this browser and are uploaded on the next visit
			return;
		}
		localStorage.removeItem(CONFIGS_KEY);
		localStorage.removeItem(LEGACY_CONFIGS_KEY);
	}

	/** Stores the current build-up as a config, updating the config with `id` if given */
	async saveConfig({
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
		const values = { name, description, keywords, builtIn: false, layers: this.snapshot() };
		if (id) {
			const config: Assembly = { id, ...values };
			await this.#commit(
				this.configs.map((c) => (c.id === id ? config : c)),
				() => updateConfig(toInput(config))
			);
			return id;
		}
		if (this.signedIn) {
			// The server creates the id
			({ id } = await createConfig(values));
		} else {
			id = crypto.randomUUID();
		}
		const config: Assembly = { id, ...values };
		await this.#commit([...this.configs.filter((c) => c.id !== id), config], async () => {});
		return id;
	}

	/** Changes name, description or tags of a config but keeps its layers */
	async updateConfigDetails(
		id: string,
		details: Partial<Pick<Assembly, 'name' | 'description' | 'keywords'>>
	) {
		const config = this.configs.find((c) => c.id === id);
		if (!config) return;
		const updated = { ...config, ...details };
		await this.#commit(
			this.configs.map((c) => (c.id === id ? updated : c)),
			() => updateConfig(toInput(updated))
		);
	}

	async deleteConfig(id: string) {
		await this.#commit(
			this.configs.filter((c) => c.id !== id),
			() => deleteConfig(id)
		);
	}

	/** Shows the changed configs and stores them in the account or, signed out, this browser */
	async #commit(configs: Assembly[], store: () => Promise<unknown>) {
		this.configs = configs;
		if (!this.signedIn) {
			this.#local = configs;
			localStorage.setItem(CONFIGS_KEY, JSON.stringify($state.snapshot(configs)));
			localStorage.removeItem(LEGACY_CONFIGS_KEY);
			return;
		}
		try {
			await store();
		} catch (e) {
			// Back to what is stored
			void getConfigs().refresh();
			throw e;
		}
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

/** A config as sent to the server */
const toInput = ({ id, name, description, keywords, layers }: Assembly) => ({
	id,
	name,
	description,
	keywords,
	layers
});

export const [getWall, setWall] = createContext<WallModel>();
