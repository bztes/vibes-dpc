import * as v from 'valibot';
import { invalid, redirect } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import {
	createSession,
	createUser,
	invalidateSession,
	isAdmin,
	verifyCredentials
} from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import { email, name, newPassword } from '#lib/validation.ts';

/** Admins land in the admin panel, everyone else in the calculator */
function home(userId: string): never {
	const row = db.select({ role: user.role }).from(user).where(eq(user.id, userId)).get();
	redirect(303, isAdmin(row) ? '/admin' : '/');
}

export const signIn = form(
	v.object({
		email,
		// Fields starting with an underscore are never sent back to the browser
		_password: v.pipe(v.string(), v.minLength(1, 'Enter your password'))
	}),
	async ({ email, _password }) => {
		const result = await verifyCredentials(email, _password);
		if (result === 'rate-limited') invalid('Too many attempts – try again in a minute');
		if (!result) invalid('Invalid email or password');
		createSession(getRequestEvent().cookies, result);
		home(result);
	}
);

/** Registers an account – the first one becomes the admin, later ones only while sign-up is enabled */
export const signUp = form(
	v.object({ name, email, _password: newPassword }),
	async ({ name, email, _password }) => {
		const result = await createUser({ name, email, password: _password });
		if (result === 'closed') invalid('Sign-up is closed');
		if (result === 'taken') invalid('An account with this email already exists');
		createSession(getRequestEvent().cookies, result);
		home(result);
	}
);

export const signOut = form(async () => {
	invalidateSession(getRequestEvent());
	redirect(303, '/');
});
