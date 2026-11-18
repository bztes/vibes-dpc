import { authenticate } from '#lib/server/auth.ts';
import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = ({ event, resolve }) => {
	authenticate(event);
	return resolve(event);
};
