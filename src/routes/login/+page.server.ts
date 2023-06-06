import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { loginUser } from '$lib/user.model';

export const load: PageServerLoad = (event) => {
	const user = event.locals.user;

	if (user) {
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	login: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());

		if (!formData.username || !formData.password) {
			return fail(400, {
				error: 'Missing email or password'
			});
		}

		const { username, password } = formData as { username: string; password: string };

		const { error, token } = await loginUser(username, password);

		if (error) {
			return fail(401, {
				error
			});
		}
		console.log('USER LOGIN: ', username);
		// Set the cookie
		event.cookies.set('AuthorizationToken', `Bearer ${token}`, {
			httpOnly: false,
			path: '/',
			secure: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 // 1 day
		});

		throw redirect(302, '/');
	},
	logout: async (event) => {
		console.log('USER LOGOUT: ', event.locals.user);
		event.cookies.delete('AuthorizationToken');
		//event.locals.user = undefined;
		throw redirect(302, '/login');
	}
};
