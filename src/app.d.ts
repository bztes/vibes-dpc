import type { SessionUser } from '#lib/server/auth.ts';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: SessionUser;
			/** Id of the current request's session (the public part of the session token) */
			sessionId?: string;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
