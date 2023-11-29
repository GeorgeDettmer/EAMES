export const ssr = false;
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user;
	if (!user && !url.pathname.includes('/login') && !url.pathname.includes('/api/health')) {
		throw redirect(302, '/login');
	}
	return {
		user
	};
};
