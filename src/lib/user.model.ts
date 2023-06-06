import { JWT_ACCESS_SECRET } from '$env/static/private';
//import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const users = [
	{ id: '1', username: 'gdettmer', password: 'test', passcode: '1234', initials: 'GD' }
];
const tokens = [{ token: 'abcd', username: 'gdettmer' }];
export const findUser = (username: string) => {
	return users.filter((u) => u.username == username)?.[0];
};
export const getUserFromToken = (token: string) => {
	const t = tokens.filter((t) => t.token == token)?.[0];
	if (!t) return null;
	return findUser(t.username);
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
	const user = findUser(username);

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

const loginUser = async (username: string, credential: string) => {
	// Check if user exists
	/* const user = await db.user.findUnique({
		where: {
			email
		}
	}); */
	const user = findUser(username);

	if (!user) {
		return {
			error: 'Could not find user with this username: ' + username
		};
	}

	// Verify the password
	//const passwordIsValid = await bcrypt.compare(password, user.password);
	const valid = user.passcode === credential || user.password === credential;
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

export { createUser, loginUser };
