import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { assembly, assemblyLayer, material } from '#lib/server/db/schema.ts';
import type { Assembly, AssemblyLayer } from '#lib/physics/types.ts';

type Query = Pick<typeof db, 'select' | 'insert' | 'delete'>;

/** Adds the layers to assembly rows */
export function readAssemblies(rows: (typeof assembly.$inferSelect)[], q: Query = db): Assembly[] {
	if (!rows.length) return [];
	const layers = q
		.select()
		.from(assemblyLayer)
		.where(
			inArray(
				assemblyLayer.assemblyId,
				rows.map((row) => row.id)
			)
		)
		.orderBy(asc(assemblyLayer.position))
		.all();
	return rows.map((row) => ({
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
	}));
}

/** Replaces the layers of an assembly; links to materials that no longer exist are dropped */
export function writeLayers(q: Query, assemblyId: string, layers: AssemblyLayer[]) {
	q.delete(assemblyLayer).where(eq(assemblyLayer.assemblyId, assemblyId)).run();
	if (!layers.length) return;
	const known = new Set(
		q
			.select({ id: material.id })
			.from(material)
			.all()
			.map((row) => row.id)
	);
	q.insert(assemblyLayer)
		.values(
			layers.map(({ material: materialId, ventilated, disabled, ...layer }, position) => ({
				...layer,
				assemblyId,
				position,
				materialId: materialId && known.has(materialId) ? materialId : null,
				ventilated: ventilated ?? false,
				disabled: disabled ?? false
			}))
		)
		.run();
}
