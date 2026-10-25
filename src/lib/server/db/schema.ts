import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { MaterialCategory } from '#lib/physics/types.ts';

export const material = sqliteTable('material', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	category: text('category').$type<MaterialCategory>().notNull(),
	lambda: real('lambda').notNull(),
	mu: real('mu').notNull(),
	thickness: real('thickness').notNull(),
	ventilated: integer('ventilated', { mode: 'boolean' }).notNull().default(false),
	note: text('note')
});

/** A build-up – either a built-in example or one saved by an admin */
export const assembly = sqliteTable('assembly', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	description: text('description').notNull().default(''),
	keywords: text('keywords', { mode: 'json' }).$type<string[]>().notNull().default([]),
	builtIn: integer('built_in', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

/** Layers store their own values so that customised materials survive catalogue changes */
export const assemblyLayer = sqliteTable('assembly_layer', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	assemblyId: text('assembly_id')
		.notNull()
		.references(() => assembly.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(),
	materialId: text('material_id').references(() => material.id, { onDelete: 'set null' }),
	name: text('name').notNull(),
	category: text('category').$type<MaterialCategory>().notNull(),
	lambda: real('lambda').notNull(),
	mu: real('mu').notNull(),
	thickness: real('thickness').notNull(),
	ventilated: integer('ventilated', { mode: 'boolean' }).notNull().default(false),
	disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false)
});

export * from './auth.schema';
