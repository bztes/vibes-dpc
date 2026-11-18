import { error, redirect } from '@sveltejs/kit';
import { isAdmin } from '#lib/server/auth.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	if (!isAdmin(locals.user)) error(403, 'Only admins can open the admin panel');
};
