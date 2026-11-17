import { sql } from 'drizzle-orm';
import { blob, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	/** scrypt `salt:key` (hex) – see `hashPassword` in `#lib/server/auth.ts` */
	passwordHash: text('password_hash').notNull(),
	role: text('role').$type<'admin' | 'user'>().notNull().default('user'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull()
});

/**
 * Session tokens are `<id>.<secret>`. Only the SHA-256 hash of the secret is stored, so a leaked
 * database can't be used to hijack sessions.
 */
export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		secretHash: blob('secret_hash', { mode: 'buffer' }).notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
	},
	(table) => [index('session_user_id_idx').on(table.userId)]
);
