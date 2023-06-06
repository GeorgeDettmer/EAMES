import { JWT_ACCESS_SECRET } from '$env/static/private';
//import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { client } from './graphql';

import { generateRandomString, validate } from '$lib/utils';

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
	console.log('findUser request:', JSON.stringify(user));
	return user;
};
export const getUserFromToken = async (token: string) => {
	const tokenQuery = await client.query(_getUserByToken, { token: token });
	const user = tokenQuery?.data?.users_tokens?.[0]?.users_tokens_user;
	console.log('getUserFromToken request:', JSON.stringify(user));
	return user;
};
const addUser = async (
	username: string,
	firstName: string,
	lastName: string,
	initials?: string,
	passcode?: string,
	password?: string
) => {
	console.log('Add user');
	const result = await client.mutation(_insertUser, {
		username: username.toLowerCase(),
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
