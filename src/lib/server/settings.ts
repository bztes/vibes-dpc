import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { setting } from '#lib/server/db/schema.ts';

/** App-wide settings with their defaults */
const defaults = {
	/** Anyone may create an account (with the `user` role); the very first account is always allowed */
	signupEnabled: false
};

export type Settings = typeof defaults;

type Query = Pick<typeof db, 'select'>;

export function getSetting<K extends keyof Settings>(key: K, q: Query = db): Settings[K] {
	const row = q.select({ value: setting.value }).from(setting).where(eq(setting.key, key)).get();
	return row ? (row.value as Settings[K]) : defaults[key];
}

export function getSettings(): Settings {
	const stored = Object.fromEntries(
		db
			.select()
			.from(setting)
			.all()
			.map((row) => [row.key, row.value])
	);
	return Object.fromEntries(
		Object.entries(defaults).map(([key, value]) => [key, key in stored ? stored[key] : value])
	) as Settings;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
	db.insert(setting)
		.values({ key, value })
		.onConflictDoUpdate({ target: setting.key, set: { value } })
		.run();
}
