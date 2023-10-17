export const generateRandomString = (length: number = 8) => {
	return crypto.randomUUID().split('-').join('').slice(0, length);
};

export const numberToLetter = (int: number) => {
	return String.fromCharCode('A'.charCodeAt(0) + int);
};

export const invertColor = (hex: string, bw: boolean) => {
	if (hex.indexOf('#') === 0) {
		hex = hex.slice(1);
	}
	// convert 3-digit hex to 6-digits.
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	if (hex.length !== 6) {
		throw new Error('Invalid HEX color.');
	}
	let r = parseInt(hex.slice(0, 2), 16);
	let g = parseInt(hex.slice(2, 4), 16);
	let b = parseInt(hex.slice(4, 6), 16);
	if (bw) {
		// https://stackoverflow.com/a/3943023/112731
		return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
	}
	// invert color components
	r = (255 - r).toString(16);
	g = (255 - g).toString(16);
	b = (255 - b).toString(16);
	// pad each with zeros and return
	return '#' + r.padStart(2, '0') + g.padStart(2, '0') + b.padStart(2, '0');
};

export const localStorageDefault = (key: string, defaultValue: string) => {
	return localStorage.getItem(key) || defaultValue;
};

export const padSerial = (sn: string = '0', minLength: number = 6) =>
	sn?.padStart(Math.max(sn.length, minLength), '0') || '0';

export const randomString = () => Math.round(Math.random() * 10e15).toString(16);

export const truncateString = (str: string, length: number = 5, suffix: string = '…') => {
	return str.length > length ? str.slice(0, length - 1) + suffix : str;
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
	link: ' cursor-pointer decoration-1 underline hover:decoration-2 hover:decoration-solid ',
	popover: ' cursor-pointer decoration-1 decoration-dotted underline hover:decoration-2 '
};

import colors from 'tailwindcss/colors.js';
export const tailwindColors = colors;

export let expandToRange = (input: string): Array<number> => {
	let splitInput: Array<String> = input.split('-');
	if (splitInput.length != 2) return [];
	let start: number = Number(splitInput[0].replace(/[^0-9]/g, ''));
	let end: number = Number(splitInput[1].replace(/[^0-9]/g, ''));

	console.log(input, splitInput, start, end);

	return Array.from({ length: (end - start) / 1 }, (value, index) => start + index * 1);
};

export function toRanges(values: string[], separator = '\u2013'): string[] {
	let refsNoPrefix = values?.map((v) => Number(v.replace(/[^0-9]/g, '')));
	if (!refsNoPrefix) return [];
	return refsNoPrefix
		.slice()
		.sort((p, q) => p - q)
		.reduce((acc, cur, idx, src) => {
			if (idx > 0 && cur - src[idx - 1] === 1) acc[acc.length - 1][1] = cur;
			else acc.push([cur]);
			return acc;
		}, [])
		.map((range) => range.join(separator));
}

export let getParameterInsensitiveAny = (object: { [x: string]: any }, keys: string[]): any => {
	if (!object) return;
	return object[
		Object.keys(object).filter((k) => {
			return keys.includes(k.toLowerCase());
		})[0]
	];
};

export let getParameterInsensitive = (object: { [x: string]: any }, key: string): any => {
	return getParameterInsensitiveAny(object, [key]);
};
