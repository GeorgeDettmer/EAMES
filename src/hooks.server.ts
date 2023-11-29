import { redirect, type Handle } from '@sveltejs/kit';

import jwt from 'jsonwebtoken';
import { findUser } from '$lib/user.model';

import { JWT_ACCESS_SECRET, HASURA_HEALTH_URL } from '$env/static/private';
const hasuraHealth = async (firstRun: boolean = false) => {
	if (!HASURA_HEALTH_URL) {
		console.error('HASURA_HEALTH_URL not set!');
		return;
	}
	const healthz = await fetch(HASURA_HEALTH_URL);
	if (healthz.status !== 200 || firstRun) {
		console.error('HASURA ENDPOINT STATUS: ', healthz?.statusText, healthz?.status);
	}
};
hasuraHealth(true);
//setInterval(hasuraHealth, 5000);

export const handle: Handle = async ({ event, resolve }) => {
	const authCookie = event.cookies.get('AuthorizationToken');

	if (authCookie) {
		if (event.url.pathname == '/api/auth/logout1') {
			console.log('(GET) USER LOGOUT: ', event.locals.user?.username);
			event.cookies.delete('AuthorizationToken');
			event.locals.user = undefined;
		} else {
			if (event.url.pathname.startsWith('/api')) {
			} else {
				try {
					const token = authCookie.split(' ')[1];
					const jwtUser = jwt.verify(token, JWT_ACCESS_SECRET);
					if (typeof jwtUser === 'string') {
						throw new Error('Something went wrong');
					}

					const user = await findUser(jwtUser?.username);
					if (!user) {
						throw new Error('User not found');
					}

					event.locals.user = {
						id: user.id,
						username: user.username,
						firstname: user.first_name,
						lastname: user.last_name,
						initials: user.initials,
						color: user.color,
						processes: user.processes,
						first_name: user.first_name,
						last_name: user.last_name,
						permissions: user.permissions
					};
					console.log('hooks', event.locals.user, event.getClientAddress());
				} catch (error) {
					console.error('hooks', error);
				}
			}
		}
	} else {
	}

	return await resolve(event);
};
