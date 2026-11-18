import * as v from 'valibot';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { command, getRequestEvent, query } from '$app/server';
import { isAdmin, requireAdmin } from '#lib/server/auth.ts';
import { readAssemblies, writeLayers } from '#lib/server/assemblies.ts';
import { db } from '#lib/server/db/index.ts';
import { assembly, material } from '#lib/server/db/schema.ts';
import { assemblyInput, category, lambda, mu, name, thickness } from '#lib/validation.ts';
import type { Catalog } from '#lib/physics/types.ts';

/** Material catalogue and templates */
export const getCatalog = query((): Catalog => {
	const materials = db.select().from(material).orderBy(asc(material.name)).all();
	const assemblies = db
		.select()
		.from(assembly)
		.where(isNull(assembly.ownerId))
		.orderBy(desc(assembly.builtIn), asc(assembly.createdAt))
		.all();
	return { materials, assemblies: readAssemblies(assemblies) };
});

/** The signed-in user as shown in the UI */
export type ClientUser = { name: string; email: string; admin: boolean };

/** The signed-in user, if any */
export const getUser = query(() => {
	const { user } = getRequestEvent().locals;
	return user
		? ({ name: user.name, email: user.email, admin: isAdmin(user) } satisfies ClientUser)
		: null;
});

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
		...assemblyInput.entries,
		layers: v.pipe(
			assemblyInput.entries.layers,
			v.minLength(1, 'A template needs at least one layer')
		)
	}),
	({ id, name, description, keywords, layers }) => {
		requireAdmin();
		const savedId = db.transaction((tx) => {
			let assemblyId = id;
			if (assemblyId) {
				const updated = tx
					.update(assembly)
					.set({ name, description, keywords })
					.where(and(eq(assembly.id, assemblyId), isNull(assembly.ownerId)))
					.run();
				if (!updated.changes) error(404, 'Template not found');
			} else {
				[{ id: assemblyId }] = tx
					.insert(assembly)
					.values({ name, description, keywords })
					.returning({ id: assembly.id })
					.all();
			}
			writeLayers(tx, assemblyId, layers);
			return assemblyId;
		});

		void getCatalog().refresh();
		return { id: savedId };
	}
);

export const deleteAssembly = command(v.string(), (id) => {
	requireAdmin();
	db.delete(assembly)
		.where(and(eq(assembly.id, id), isNull(assembly.ownerId)))
		.run();
	void getCatalog().refresh();
});
