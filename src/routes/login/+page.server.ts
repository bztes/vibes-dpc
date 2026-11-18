import { redirect } from '@sveltejs/kit';
import { hasUsers, isAdmin, signupOpen } from '#lib/server/auth.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(302, isAdmin(locals.user) ? '/admin' : '/');
	// Nobody can sign in yet – the first account has to be created
	if (!hasUsers()) redirect(302, '/signup');
	return { signupOpen: signupOpen() };
};
