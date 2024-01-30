export const ssr = false;
export const prerender = false;

import type { PageLoad } from './$types';

export const load = (async () => {
	return {};
}) satisfies PageLoad;
