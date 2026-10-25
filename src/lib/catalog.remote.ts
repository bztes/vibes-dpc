import * as v from 'valibot';
import { asc, desc, eq } from 'drizzle-orm';
import { command, getRequestEvent, query } from '$app/server';
import { isAdmin, requireAdmin } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { assembly, assemblyLayer, material } from '#lib/server/db/schema.ts';
import { materialCategories, type Assembly, type Catalog } from '#lib/physics/types.ts';

/** Material catalogue and templates */
export const getCatalog = query((): Catalog => {
	const materials = db.select().from(material).orderBy(asc(material.name)).all();
	const assemblies = db
		.select()
		.from(assembly)
		.orderBy(desc(assembly.builtIn), asc(assembly.createdAt))
		.all();
	const layers = db.select().from(assemblyLayer).orderBy(asc(assemblyLayer.position)).all();

	return {
		materials,
		assemblies: assemblies.map((row): Assembly => ({
			id: row.id,
			name: row.name,
			description: row.description,
			keywords: row.keywords,
			builtIn: row.builtIn,
			layers: layers
				.filter((layer) => layer.assemblyId === row.id)
				.map(({ materialId, name, category, lambda, mu, thickness, ventilated, disabled }) => ({
					material: materialId ?? undefined,
					name,
					category,
					lambda,
					mu,
					thickness,
					ventilated,
					disabled
				}))
		}))
	};
});

/** The signed-in user, if any */
export const getUser = query(() => {
	const { user } = getRequestEvent().locals;
	return user ? { name: user.name, email: user.email, admin: isAdmin(user) } : null;
});

const name = v.pipe(v.string(), v.trim(), v.minLength(1, 'Name is required'), v.maxLength(120));
const category = v.picklist(materialCategories);
const lambda = v.pipe(v.number(), v.minValue(0.001), v.maxValue(500));
const mu = v.pipe(v.number(), v.minValue(0), v.maxValue(10_000_000));
const thickness = v.pipe(v.number(), v.gtValue(0), v.maxValue(5000));

export const saveMaterial = command(
	v.object({
		id: v.optional(v.string()),
		name,
		category,
		lambda,
		mu,
		thickness,
		ventilated: v.boolean(),
		note: v.optional(v.nullable(v.string()))
	}),
	({ id, ...values }) => {
		requireAdmin();
		if (id) {
			db.update(material).set(values).where(eq(material.id, id)).run();
		} else {
			id = `${values.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '')}-${crypto.randomUUID().slice(0, 6)}`;
			db.insert(material)
				.values({ id, ...values })
				.run();
		}
		void getCatalog().refresh();
		return { id };
	}
);

export const deleteMaterial = command(v.string(), (id) => {
	requireAdmin();
	db.delete(material).where(eq(material.id, id)).run();
	void getCatalog().refresh();
});

export const saveAssembly = command(
	v.object({
		/** Update this template instead of creating a new one */
		id: v.optional(v.string()),
		name,
		description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500)), ''),
		keywords: v.optional(
			v.pipe(
				v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(60))),
				v.maxLength(30)
			),
			[]
		),
		layers: v.pipe(
			v.array(
				v.object({
					material: v.optional(v.string()),
					name,
					category,
					lambda,
					mu,
					thickness,
					ventilated: v.optional(v.boolean()),
					disabled: v.optional(v.boolean())
				})
			),
			v.minLength(1, 'A template needs at least one layer')
		)
	}),
	({ id, name, description, keywords, layers }) => {
		requireAdmin();
		const known = new Set(
			db
				.select({ id: material.id })
				.from(material)
				.all()
				.map((row) => row.id)
		);

		const savedId = db.transaction((tx) => {
			let assemblyId = id;
			if (assemblyId) {
				tx.update(assembly)
					.set({ name, description, keywords })
					.where(eq(assembly.id, assemblyId))
					.run();
				tx.delete(assemblyLayer).where(eq(assemblyLayer.assemblyId, assemblyId)).run();
			} else {
				[{ id: assemblyId }] = tx
					.insert(assembly)
					.values({ name, description, keywords })
					.returning({ id: assembly.id })
					.all();
			}
			tx.insert(assemblyLayer)
				.values(
					layers.map(({ material: materialId, ventilated, disabled, ...layer }, position) => ({
						...layer,
						assemblyId: assemblyId!,
						position,
						materialId: materialId && known.has(materialId) ? materialId : null,
						ventilated: ventilated ?? false,
						disabled: disabled ?? false
					}))
				)
				.run();
			return assemblyId;
		});

		void getCatalog().refresh();
		return { id: savedId };
	}
);

export const deleteAssembly = command(v.string(), (id) => {
	requireAdmin();
	db.delete(assembly).where(eq(assembly.id, id)).run();
	void getCatalog().refresh();
});
