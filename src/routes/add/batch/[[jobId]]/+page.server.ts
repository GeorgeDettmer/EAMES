import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	return {
		jobId: params?.jobId
	};
}) satisfies PageServerLoad;
