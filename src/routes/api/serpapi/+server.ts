import { getJson } from 'serpapi';

import type { RequestHandler } from './$types';
import { PUBLIC_SERPAPI_KEY } from '$env/static/public';

export const GET: RequestHandler = async ({ url }) => {
	/* let api = new URL('https://serpapi.com/search.json');
	[...url.searchParams.entries()].forEach((param) => {
		console.log('p', param[0], param[1]);
		api.searchParams.set(param[0], param[1]);
	});
	console.log(api.toString());
	let response = await fetch(api);
	let result = await response.json();
	if (response.status === 200) {
		console.log('success', response);
	} else {
		console.log('fail', response);
	} */
	let options = {};
	[...url.searchParams.entries()].forEach((param) => {
		console.log('p', param[0], param[1]);
		options[param[0]] = param[1];
	});
	options.api_key = PUBLIC_SERPAPI_KEY;
	const response = await getJson(options);
	return new Response(response);
};
