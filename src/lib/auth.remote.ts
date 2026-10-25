import * as v from 'valibot';
import { invalid, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { form, getRequestEvent } from '$app/server';
import { auth, hasAdmin } from '#lib/server/auth.ts';

const email = v.pipe(v.string(), v.trim(), v.email('Enter a valid email address'));

/** Runs a Better Auth call and turns its errors into form issues */
async function attempt(action: () => Promise<unknown>, fallback: string) {
	let message: string | undefined;
	try {
		await action();
	} catch (error) {
		if (!(error instanceof APIError)) throw error;
		message = error.message || fallback;
	}
	if (message) invalid(message);
}

export const signIn = form(
	v.object({
		email,
		// Fields starting with an underscore are never sent back to the browser
		_password: v.pipe(v.string(), v.minLength(1, 'Enter your password'))
	}),
	async ({ email, _password }) => {
		await attempt(
			() => auth.api.signInEmail({ body: { email, password: _password } }),
			'Sign-in failed'
		);
		redirect(303, '/admin');
	}
);

/** Creates the first (and only) admin account */
export const signUp = form(
	v.object({
		name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Enter your name')),
		email,
		_password: v.pipe(v.string(), v.minLength(8, 'Use at least 8 characters'))
	}),
	async ({ name, email, _password }) => {
		if (hasAdmin()) invalid('Registration is closed – an admin account already exists');
		await attempt(
			() => auth.api.signUpEmail({ body: { name, email, password: _password } }),
			'Registration failed'
		);
		redirect(303, '/admin');
	}
);

export const signOut = form(async () => {
	await auth.api.signOut({ headers: getRequestEvent().request.headers });
	redirect(303, '/');
});
