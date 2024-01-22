import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { redirect, type Handle } from '@sveltejs/kit';

import jwt from 'jsonwebtoken';
import { findUser } from '$lib/user.model';

import { JWT_ACCESS_SECRET, HASURA_HEALTH_URL } from '$env/static/private';
import { dev } from '$app/environment';

Sentry.init({
	dsn: 'https://e4470f743dce413934de370a59515993@o1053754.ingest.sentry.io/4506309759008768',
	tracesSampleRate: 1,
	environment: dev ? 'development' : 'production',
	enabled: !dev,
	integrations: [new Sentry.Integrations.Anr({ captureStackTrace: true })]
});

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

export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {
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

					if (!jwtUser?.username) {
						throw new Error('jwtUser not found');
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
					console.log('hooks', event.locals.user.username, event.locals.user.id, event.getClientAddress());
				} catch (error) {
					console.error('hooks', error);
				}
			}
		}
	} else {
	}

	return await resolve(event);
});
export const handleError = Sentry.handleErrorWithSentry();
