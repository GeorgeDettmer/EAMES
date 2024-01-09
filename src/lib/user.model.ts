import { JWT_ACCESS_SECRET } from '$env/static/private';
//import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { client } from './graphql';

import { generateRandomString, validate } from '$lib/utils';
import { json } from '@sveltejs/kit';

const _getUserByUsername = `#graphql
	query getUserByUsername($username: String!) {
		users(where: {username: {_ilike: $username}}) {
			id
			username
			first_name
			last_name
			initials
			password
			passcode
			color
			processes
			permissions
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
				password
				passcode
				color
				processes
			}
		}
	}
`;

const _insertLoginToken = `#graphql
	mutation insertLoginToken($token: String!, $user_id: uuid!) {
		insert_users_tokens_one(object: {user_id: $user_id, token: $token}) {
			token
			user_id
		}
	}
`;

const _insertUser = `#graphql
	mutation insertUser($username: String!, $first_name: String!, $last_name: String!, $initials: String!, $passcode: String, $password: String) {
		insert_users_one(object: {username: $username, first_name: $first_name, last_name: $last_name, initials: $initials, passcode: $passcode, password: $password}) {
			id
			username
			first_name
			last_name
			initials
			passcode
			password
		}
	}
`;

export const findUser = async (username: string) => {
	const userQuery = await client.query(_getUserByUsername, { username: username });
	const user = userQuery?.data?.users?.[0];
	console.log(`findUser request: ${user?.username}(${user?.id})`);
	return user;
};
export const getUserFromToken = async (token: string) => {
	const tokenQuery = await client.query(_getUserByToken, { token: token });
	if (tokenQuery?.error) {
		console.error('GraphQL query error', tokenQuery.error.message);
		return { error: `GraphQL query error ` + tokenQuery.error.message };
	}
	const user = tokenQuery?.data?.users_tokens?.[0]?.users_tokens_user;
	if (!user) {
		return { error: `No user found for token (${token})` };
	}
	if (!tokenQuery?.data?.users_tokens?.[0]?.active) {
		return { error: `Token (${token}) is disabled` };
	}
	if (tokenQuery?.data?.users_tokens?.[0]?.expires_at) {
		const expire = new Date(tokenQuery?.data?.users_tokens?.[0]?.expires_at);
		if (new Date() > expire) {
			return { error: `Token (${token}) expired @ ${expire.toLocaleTimeString()} ${expire.toLocaleDateString()}` };
		}
	}

	console.log(`getUserFromToken request: ${user?.username}(${user?.id})`);
	return { user };
};
const addUser = async (
	username: string,
	firstName: string,
	lastName: string,
	initials?: string,
	passcode?: string,
	password?: string
) => {
	const result = await client.mutation(_insertUser, {
		username: username,
		first_name: firstName,
		last_name: lastName,
		initials: initials,
		passcode: passcode ?? null,
		password: password ?? null
	});
	const newUser = result?.data?.insert_users_one;
	console.log('addUser:', JSON.stringify(newUser));
	return newUser;
};
export const addLoginToken = async (userId: string, loginToken?: string) => {
	if (!loginToken) {
		loginToken = generateRandomString();
	}
	const result = await client.mutation(_insertLoginToken, { token: loginToken, user_id: userId });
	const newToken = result?.data?.insert_users_tokens_one?.token;
	console.log('NEW TOKEN:', result?.data?.insert_users_tokens_one);
	return newToken;
};

const createUser = async (
	username: string,
	firstName: string,
	lastName: string,
	initials?: string,
	password?: string,
	passcode?: string
) => {
	// Check if username is valid
	if (!validate(username)) {
		return {
			error: 'Invalid username'
		};
	}
	//Check if user with username already exits
	const user = await findUser(username);
	if (user) {
		return {
			error: 'User with this username already exists'
		};
	}
	let missingInfo = [];
	//Check if a passcode or password was provided
	if (!validate(firstName)) {
		missingInfo.push('first name');
	} else if (!validate(lastName)) {
		missingInfo.push('last name');
	}
	if (missingInfo.length > 0) {
		return {
			error: 'Missing information: ' + missingInfo.join(', ')
		};
	}
	if (!initials) {
		initials = (firstName?.[0] + lastName?.[0]).toUpperCase();
	}
	if (!passcode) {
		passcode = Math.floor(Math.random() * 9000 + 1000).toString();
	}

	try {
		let user = await addUser(username, firstName, lastName, initials, passcode, password);
		console.log(JSON.stringify(user));
		let token = await addLoginToken(user.id);
		console.log(JSON.stringify(token));
		return { user };
	} catch (error) {
		return {
			error: 'Something went wrong'
		};
	}
};

const getJwt = (user) => {
	return {
		id: user.id,
		username: user.username,
		firstname: user.first_name,
		lastname: user.last_name,
		initials: user.initials,
		'https://hasura.io/jwt/claims': {
			'x-hasura-default-role': user.username == 'gdettmer' ? 'admin' : 'user',
			'x-hasura-allowed-roles': ['user', 'admin'],
			'x-hasura-user-id': user.id /* ,
			'x-hasura-user-permissions': user.permissions,
			'x-hasura-user-processes': user.processes */
		}
	};
};
const loginUsernamePass = async (username: string = '', pass: string) => {
	const user = await findUser(username);
	if (!user) {
		return {
			error: 'Could not find user with the supplied username'
		};
	}
	//const passwordIsValid = await bcrypt.compare(password, user.password);
	//Check if suppied pass string matches either the password or passcode values
	const valid = user?.passcode === pass || user?.password === pass;
	if (!valid) {
		return {
			error: 'Incorrect password'
		};
	}

	const jwtUser = getJwt(user);

	const token = jwt.sign(jwtUser, JWT_ACCESS_SECRET, {
		expiresIn: '365d'
	});

	return { token };
};

const loginToken = async (loginToken: string) => {
	const { error, user } = await getUserFromToken(loginToken);
	if (error) {
		return {
			error
		};
	}

	const jwtUser = getJwt(user);

	const token = jwt.sign(jwtUser, JWT_ACCESS_SECRET, {
		expiresIn: '365d'
	});

	return { token };
};

export { createUser, loginUsernamePass, loginToken };
