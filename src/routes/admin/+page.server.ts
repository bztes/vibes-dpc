import { redirect } from '@sveltejs/kit';
import { isAdmin } from '#lib/server/auth.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!isAdmin(locals.user)) redirect(302, '/admin/login');
};
