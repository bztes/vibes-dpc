import * as v from 'valibot';
import { invalid, redirect } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import {
	createAdmin,
	createSession,
	invalidateSession,
	MAX_PASSWORD_LENGTH,
	verifyCredentials
} from '#lib/server/auth.ts';

const email = v.pipe(v.string(), v.trim(), v.email('Enter a valid email address'));

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
		redirect(303, '/admin');
	}
);

/** Creates the first (and only) admin account */
export const signUp = form(
	v.object({
		name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Enter your name')),
		email,
		_password: v.pipe(
			v.string(),
			v.regex(/^[\x20-\x7E]*$/, 'Use letters, digits, spaces and common symbols only'),
			v.check((p) => p.trim() === p, 'Remove spaces at the start and end'),
			v.minLength(8, 'Use at least 8 characters'),
			v.maxLength(MAX_PASSWORD_LENGTH, `Use at most ${MAX_PASSWORD_LENGTH} characters`)
		)
	}),
	async ({ name, email, _password }) => {
		const userId = await createAdmin({ name, email, password: _password });
		if (!userId) invalid('Registration is closed – an admin account already exists');
		createSession(getRequestEvent().cookies, userId);
		redirect(303, '/admin');
	}
);

export const signOut = form(async () => {
	invalidateSession(getRequestEvent());
	redirect(303, '/');
});
