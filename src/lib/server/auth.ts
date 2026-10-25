import { ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { count } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';

/** Only the very first account can be registered – it becomes the admin and sign-up is closed afterwards. */
export function hasAdmin() {
	const [{ value }] = db.select({ value: count() }).from(user).all();
	return value > 0;
}

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	user: {
		additionalFields: {
			role: { type: 'string', required: false, defaultValue: 'user', input: false }
		}
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					if (hasAdmin()) throw new APIError('FORBIDDEN', { message: 'Registration is closed' });
					return { data: { ...user, role: 'admin' } };
				}
			}
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

export const isAdmin = (user: App.Locals['user']) => user?.role === 'admin';

/** Throws 401 unless the current request belongs to a signed-in admin */
export function requireAdmin() {
	const { locals } = getRequestEvent();
	if (!isAdmin(locals.user)) error(401, 'Admin login required');
	return locals.user!;
}
