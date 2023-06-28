import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { loginUsernamePass, loginToken } from '$lib/user.model';

export const load: PageServerLoad = (event) => {
	const user = event.locals.user;

	if (user) {
		throw redirect(302, '/');
	}
};

export const actions: Actions = {
	login: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());

		/* if ((!formData.username || !formData.password) && !formData.token) {
			return fail(400, {
				error: 'Missing email or password / token'
			});
		} */

		const { username, password, login_token } = formData as {
			username: string;
			password: string;
			login_token: string;
		};

		const { error, token } = login_token
			? await loginToken(login_token)
			: await loginUsernamePass(username.toLowerCase(), password);
		if (error) {
			return fail(401, { error });
		}

		console.log('USER LOGIN: ', username ?? login_token);
		// Set the cookie
		event.cookies.set('AuthorizationToken', `Bearer ${token}`, {
			httpOnly: false,
			path: '/',
			secure: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 // 1 day
		});

		//throw redirect(302, '/');
	},
	logout: async (event) => {
		console.log('USER LOGOUT: ', event.locals.user?.username);
		event.cookies.delete('AuthorizationToken');
		event.locals.user = undefined;
		throw redirect(302, '/');
	}
};
