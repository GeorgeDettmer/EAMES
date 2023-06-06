export const generateRandomString = (length: number = 8) => {
	return crypto.randomUUID().split('-').join('').slice(0, length);
};

export const validate = (thing: any, type: string = 'string') => !!thing && typeof thing === type;
