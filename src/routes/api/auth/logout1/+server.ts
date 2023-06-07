import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = ((event) => {
	console.log('USER LOGOUT: ', event.locals.user?.username);
	event.cookies.delete('AuthorizationToken');
	event.locals.user = undefined;
	return new Response();
}) satisfies RequestHandler;
