import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { command, getRequestEvent, query } from '$app/server';
import { readAssemblies, writeLayers } from '#lib/server/assemblies.ts';
import { db } from '#lib/server/db/index.ts';
import { assembly } from '#lib/server/db/schema.ts';
import { assemblyInput } from '#lib/validation.ts';
import type { Assembly } from '#lib/physics/types.ts';

function requireUser() {
	const { user } = getRequestEvent().locals;
	if (!user) error(401, 'Sign in to save build-ups to your account');
	return user;
}

/** The signed-in user's build-ups, oldest first, or `null` when signed out */
export const getConfigs = query((): Assembly[] | null => {
	const { user } = getRequestEvent().locals;
	if (!user) return null;
	return readAssemblies(
		db
			.select()
			.from(assembly)
			.where(eq(assembly.ownerId, user.id))
			.orderBy(asc(assembly.createdAt))
			.all()
	);
});

/** Stores a new build-up for the signed-in user; the id is always created here */
function insertConfig(
	q: Parameters<Parameters<typeof db.transaction>[0]>[0],
	ownerId: string,
	{ name, description, keywords, layers }: v.InferOutput<typeof assemblyInput>
) {
	const [{ id }] = q
		.insert(assembly)
		.values({ ownerId, name, description, keywords })
		.returning({ id: assembly.id })
		.all();
	writeLayers(q, id, layers);
	return id;
}

export const createConfig = command(assemblyInput, (input) => {
	const user = requireUser();
	const id = db.transaction((tx) => insertConfig(tx, user.id, input));
	void getConfigs().refresh();
	return { id };
});

/** Replaces one of the signed-in user's build-ups */
export const updateConfig = command(
	v.object({ id: v.string(), ...assemblyInput.entries }),
	({ id, name, description, keywords, layers }) => {
		const user = requireUser();
		db.transaction((tx) => {
			const updated = tx
				.update(assembly)
				.set({ name, description, keywords })
				.where(and(eq(assembly.id, id), eq(assembly.ownerId, user.id)))
				.run();
			if (!updated.changes) error(404, 'Build-up not found');
			writeLayers(tx, id, layers);
		});
		void getConfigs().refresh();
	}
);

/** Adds build-ups saved in the browser before signing in; they get new ids */
export const importConfigs = command(
	v.pipe(v.array(assemblyInput), v.maxLength(500)),
	(configs) => {
		const user = requireUser();
		db.transaction((tx) => {
			for (const input of configs) insertConfig(tx, user.id, input);
		});
		void getConfigs().refresh();
	}
);

export const deleteConfig = command(v.string(), (id) => {
	const user = requireUser();
	db.delete(assembly)
		.where(and(eq(assembly.id, id), eq(assembly.ownerId, user.id)))
		.run();
	void getConfigs().refresh();
});
