export const generateRandomString = (length: number = 8) => {
	return crypto.randomUUID().split('-').join('').slice(0, length);
};

export const localStorageDefault = (key: string, defaultValue: string) => {
	return localStorage.getItem(key) || defaultValue;
};

export const randomString = () => Math.round(Math.random() * 10e15).toString(16);

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
		'#8bc34a',
		'#afb42b',
		'#ff9800',
		'#ff5722',
		'#795548',
		'#607d8b'
	];

	var hash = 0;
	if (typeof string !== 'string' || string?.length === 0) return hash;
	for (var i = 0; i < string.length; i++) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
		hash = hash & hash;
	}
	hash = ((hash % colors.length) + colors.length) % colors.length;
	return colors[hash];
};

export const stringToColorClass = (string: string) => {
	var colors = [
		'pink-500',
		'blue-500',
		'yellow-500',
		'orange-500',
		'brown-500',
		'purple-500',
		'indigo-500',
		'cyan-500',
		'deep-orange-500',
		'deep-purple-500'
	];
	if (typeof string !== 'string' || string?.length === 0) return 'grey-500';

	let hash = 0;
	for (var i = 0; i < string.length; i++) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
		hash = hash & hash;
	}
	hash = ((hash % colors.length) + colors.length) % colors.length;
	return colors[hash];
};

export const classes = {
	link: ' cursor-pointer decoration-1 decoration-dotted underline hover:decoration-2 hover:decoration-solid '
};

import colors from 'tailwindcss/colors.js';
export const tailwindColors = colors;
