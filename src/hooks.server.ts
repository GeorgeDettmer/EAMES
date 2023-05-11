import type { Handle, HandleFetch } from '@sveltejs/kit';

/* export const handle: Handle = async ({ resolve, event }) => {
	const response = await resolve(event);

	console.log(event.getClientAddress());
	return response;
}; */

export const handleFetch: HandleFetch = async ({ request, fetch, event }) => {
	//if (request.url.startsWith(event.url.origin)) {
	// Workaround: https://github.com/sveltejs/kit/issues/6608
	//request.headers.set('origin', event.url.origin);
	console.log(request.url, request.body.source);
	//}

	return fetch(request);
};
