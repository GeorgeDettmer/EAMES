import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/core/providers/credentials';

const users = [{ id: '1', username: 'gdettmer', password: 'test', passcode: 1234, initials: 'GD' }];
const tokens = [{ token: 'abcd', username: 'gdettmer' }];
const findUser = (username: string) => {
	return users.filter((u) => u.username == username)?.[0];
};
const getUserFromToken = (token: string) => {
	const t = tokens.filter((t) => t.token == token)?.[0];
	if (!t) return null;
	return findUser(t.username);
};

export const handle = SvelteKitAuth({
	providers: [
		/* Credentials({
			// `credentials` is used to generate a form on the sign in page.
			// You can specify which fields should be submitted, by adding keys to the `credentials` object.
			// e.g. domain, username, password, 2FA token, etc.
			// You can pass any HTML attribute to the <input> tag through the object.
			id: 'username',
			name: 'Credentials',
			credentials: {
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' },
				passcode: { label: 'Passcode', type: 'password' }
			},
			async authorize(credentials, req) {
				// Add logic here to look up the user from the credentials supplied
				console.log('USERNAME LOGIN: ', credentials.username);
				const user = findUser(credentials.username);
				if (
					user &&
					(credentials?.password == user?.password || credentials?.passcode == user?.passcode)
				) {
					// Any object returned will be saved in `user` property of the JWT
					console.log('LOGIN USER: ', user);
					return user;
				} else {
					// If you return null then an error will be displayed advising the user to check their details.
					return null;

					// You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
				}
			}
		}), */
		Credentials({
			// `credentials` is used to generate a form on the sign in page.
			// You can specify which fields should be submitted, by adding keys to the `credentials` object.
			// e.g. domain, username, password, 2FA token, etc.
			// You can pass any HTML attribute to the <input> tag through the object.
			//id: 'token',
			//name: 'Token',
			credentials: {
				token: { label: 'Token', type: 'password' },
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' },
				passcode: { label: 'Passcode', type: 'password' }
			},
			async authorize(credentials, req) {
				// Add logic here to look up the user from the credentials supplied
				console.log('LOGIN: ', credentials);
				let user = null;
				if (credentials?.token) {
					console.log('TOKEN LOGIN: ', credentials.token);
					user = getUserFromToken(credentials.token);
				} else if (credentials?.username) {
					console.log('USERNAME LOGIN: ', credentials.username);
					user = findUser(credentials.username);
					if (credentials?.password != user?.password && credentials?.passcode != user?.passcode) {
						user = null;
					}
				}
				if (user) {
					console.log('LOGIN USER: ', user);
					// Any object returned will be saved in `user` property of the JWT
					return user;
				} else {
					// If you return null then an error will be displayed advising the user to check their details.
					return null;

					// You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
				}
			}
		})
	],
	secret: 'a5f2dbf71864cb37a3de3c1ea507d014',
	trustHost: true,
	debug: true
});
