import { redirect } from '@sveltejs/kit';
import { hasUsers, isAdmin, signupOpen } from '#lib/server/auth.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(302, isAdmin(locals.user) ? '/admin' : '/');
	return { firstRun: !hasUsers(), open: signupOpen() };
};
