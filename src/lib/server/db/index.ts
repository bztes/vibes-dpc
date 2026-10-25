import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { seed } from './seed';
import { building } from '$app/env';
import { DATABASE_URL } from '$app/env/private';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = new Database(DATABASE_URL);
client.pragma('foreign_keys = ON');

export const db = drizzle(client, { schema });

// Bring the schema up to date and fill an empty database with the default catalogue
if (!building) {
	migrate(db, { migrationsFolder: 'drizzle' });
	seed(db);
}
