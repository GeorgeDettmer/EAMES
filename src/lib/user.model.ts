import { JWT_ACCESS_SECRET } from '$env/static/private';
//import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { client } from './graphql';

const _getUserByUsername = `#graphql
	query getUserByUsername($username: String!) {
		users(where: {username: {_eq: $username}}) {
			id
			username
			first_name
			last_name
			initials
			passcode
		}
	}
`;

const _getUserByToken = `#graphql
	query getUserByToken($token: String!) {
		users_tokens(where: {token: {_eq: $token}}) {
			token
			user_id
			active
			expires_at
			users_tokens_user {
				id
				username
				first_name
				last_name
				initials
			}
		}
	}
`;

const users = [
	{ id: '1', username: 'gdettmer', password: 'test', passcode: '1234', initials: 'GD' }
];
const tokens = [{ token: 'abcd', username: 'gdettmer' }];
/* export const findUser = (username: string) => {
	return users.filter((u) => u.username == username)?.[0];
}; */
export const findUser = async (username: string) => {
	const userQuery = await client.query(_getUserByUsername, { username: username });
	const user = userQuery?.data?.users?.[0];
	console.log('findUser request: ', JSON.stringify(user));
	return user;
};
export const getUserFromToken = async (token: string) => {
	const tokenQuery = await client.query(_getUserByToken, { token: token });
	const user = tokenQuery?.data?.users_tokens?.[0]?.users_tokens_user;
	console.log('getUserFromToken request: ', JSON.stringify(user));
	return user;
};

const generateRandom = (length: number = 8) => {
	return crypto.randomUUID().split('-').join('').slice(0, length);
};

const createUser = async (
	username: string,
	password: string,
	initials: string = '',
	passcode: string = ''
) => {
	// Check if user exists
	if (!username || typeof username != 'string') {
		return {
			error: 'A password must be provided'
		};
	}
	const user = await findUser(username);

	if (user) {
		return {
			error: 'User with this username already exists'
		};
	}
	if (!password || typeof password != 'string') {
		return {
			error: 'A password must be provided'
		};
	}

	try {
		const user = {
			id: crypto.randomUUID(),
			username: username,
			password: password,
			passcode: passcode || Math.floor(Math.random() * 9000 + 1000).toString(),
			initials: initials || ''
		};

		users.push(user);
		console.log('NEW USER: ', user, '=>', users);

		tokens.push({ token: generateRandom(8), username: username });
		console.log('NEW USER TOKEN: ', tokens);

		return { user };
	} catch (error) {
		return {
			error: 'Something went wrong'
		};
	}
};

const loginUsernamePass = async (username: string = '', pass: string) => {
	const user = await findUser(username);
	if (!user) {
		return {
			error: 'Could not find user with this username: ' + username
		};
	}
	//const passwordIsValid = await bcrypt.compare(password, user.password);
	//Check if suppied pass string matches either the password or passcode values
	const valid = user?.passcode === pass || user?.password === pass;
	if (!valid) {
		return {
			error: 'Invalid credentials'
		};
	}

	const jwtUser = {
		id: user.id,
		username: user.username
	};

	const token = jwt.sign(jwtUser, JWT_ACCESS_SECRET, {
		expiresIn: '1d'
	});

	return { token };
};

const loginToken = async (loginToken: string) => {
	const user = await getUserFromToken(loginToken);
	if (!user) {
		return {
			error: 'Could not find user associated to this token: ' + loginToken
		};
	}

	const jwtUser = {
		id: user.id,
		username: user.username
	};

	const token = jwt.sign(jwtUser, JWT_ACCESS_SECRET, {
		expiresIn: '1d'
	});

	return { token };
};

export { createUser, loginUsernamePass, loginToken };
