export const generateRandomString = (length: number = 8) => {
	return crypto.randomUUID().split('-').join('').slice(0, length);
};

export const validate = (thing: any, type: string = 'string') => !!thing && typeof thing === type;

export const stringToColor = (string: string) => {
	var colors = [
		'#e51c23',
		'#e91e63',
		'#9c27b0',
		'#fcf403',
		'#3f51b5',
		'#fc03d7',
		'#00f9f4',
		'#00bcd4',
		'#009688',
		'#209b24',
		'#8bc34a',
		'#afb42b',
		'#ff9800',
		'#ff5722',
		'#795548',
		'#607d8b'
	];

	var hash = 0;
	if (string.length === 0) return hash;
	for (var i = 0; i < string.length; i++) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
		hash = hash & hash;
	}
	hash = ((hash % colors.length) + colors.length) % colors.length;
	return colors[hash];
};