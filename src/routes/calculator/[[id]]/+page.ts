import { redirect } from '@sveltejs/kit';
import { templatePath } from '#lib/wall.svelte.ts';

// Old links: the calculator moved to the root
export function load({ params }) {
	redirect(308, templatePath(params.id ? { id: params.id } : undefined));
}
