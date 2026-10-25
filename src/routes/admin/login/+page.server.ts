import { redirect } from '@sveltejs/kit';
import { hasAdmin, isAdmin } from '#lib/server/auth.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (isAdmin(locals.user)) redirect(302, '/admin');
	return { firstRun: !hasAdmin() };
};
