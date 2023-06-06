import type { Handle } from '@sveltejs/kit';

import { JWT_ACCESS_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';

import { findUser } from './lib/user.model';

export const handle: Handle = async ({ event, resolve }) => {
	const authCookie = event.cookies.get('AuthorizationToken');

	if (authCookie) {
		const token = authCookie.split(' ')[1];

		try {
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
				initials: user.initials
			};
		} catch (error) {
			console.error(error);
		}
	}

	return await resolve(event);
};
