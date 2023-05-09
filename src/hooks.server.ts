import type { Handle, HandleFetch } from '@sveltejs/kit';

/* export const handle: Handle = async ({ resolve, event }) => {
	const response = await resolve(event);

	// Apply CORS header for API routes
	//if (event.url.pathname.startsWith('/api')) {
	// Required for CORS to work
	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': '*'
			}
		});
	}

	response.headers.append('Access-Control-Allow-Origin', `*`);
	//}
	return response;
}; */

export const handleFetch: HandleFetch = async ({ request, fetch, event }) => {
	//if (request.url.startsWith(event.url.origin)) {
	// Workaround: https://github.com/sveltejs/kit/issues/6608
	//request.headers.set('origin', event.url.origin);
	console.log(request.url, request.body);
	//}

	return fetch(request);
};
