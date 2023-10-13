import { getJson } from 'serpapi';

import type { RequestHandler } from './$types';
import { PUBLIC_SERPAPI_KEY } from '$env/static/public';
import { error, json } from '@sveltejs/kit';

console.log('test');

let cache = {};

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
	let options: any = {};
	[...url.searchParams.entries()].forEach((param) => {
		console.log('p', param[0], param[1]);
		options[param[0]] = param[1];
	});
	options.api_key = PUBLIC_SERPAPI_KEY;
	console.log('cache', Object.keys(cache));
	const q = options?.q;
	const engine = options?.engine;
	if (q && engine) {
		if (cache?.[q]) {
			console.log('is cached', q);
			return json(cache[q]);
		} else {
			console.log('not cached', q);
			const response = await getJson(options);
			cache[q] = response;
			return json(response);
		}
	}
	throw error(400, "No 'q' query parameter provided");
};
