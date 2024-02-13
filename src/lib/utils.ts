export const generateRandomString = (length: number = 8) => {
	return crypto.randomUUID().split('-').join('').slice(0, length);
};

export const numberToLetter = (int: number, offset: number = 65) => {
	return String.fromCharCode(offset + int);
};

export const letterToNumber = (letter: string, offset: number = 65) => {
	return letter.toUpperCase().charCodeAt(0) - offset;
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

export const padString = (sn: string = '0', minLength: number = 6) =>
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
	popover: ' cursor-pointer decoration-1 decoration-dotted underline '
};

import { messagesStore } from 'svelte-legos';
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
			let match = keys.includes(k.toLowerCase());
			//if (match) console.log('getParameterInsensitiveAny', k, keys, match);

			return match;
			//return keys.filter((matchKeys) => matchKeys.toLowerCase() === k.toLowerCase())?.length > 0;
		})[0]
	];
};

export let datetimeFormat = (datetime: string, inlcudeTime: boolean = true): string => {
	const d = new Date(datetime);
	let time = d.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit'
	});
	let date = d.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit'
	});
	return (inlcudeTime ? time + ' ' : '') + date;
};

export let getParameterInsensitive = (object: { [x: string]: any }, key: string): any => {
	return getParameterInsensitiveAny(object, [key]);
};

export let carrier_codes = ['ups', 'fedex', 'dhl_express'];
export let carrier_names = ['UPS', 'FEDEX', 'DHL'];
export let carrier_urls = {
	ups: (t: string): string => `https://www.ups.com/track?track=yes&trackNums=${t}`,
	fedex: (t: string): string => `https://www.fedex.com/fedextrack/?tracknumbers=${t}`,
	dhl_express: (t: string): string =>
		`https://www.dhl.com/gb-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${t}`
};

export let downloadFileFromText = (blob: Blob, name: string) => {
	let a = document.createElement('a');
	a.hidden = true;
	document.body.append(a);
	a.download = name;
	a.href = URL.createObjectURL(blob);
	a.click();
	a.remove();
};

export function copyToClipboard(text: string) {
	return new Promise((resolve, reject) => {
		if (
			typeof navigator !== 'undefined' &&
			typeof navigator.clipboard !== 'undefined' &&
			navigator.permissions !== 'undefined'
		) {
			const type = 'text/plain';
			const blob = new Blob([text], { type });
			const data = [new ClipboardItem({ [type]: blob })];
			navigator.permissions.query({ name: 'clipboard-write' }).then((permission) => {
				if (permission.state === 'granted' || permission.state === 'prompt') {
					navigator.clipboard.write(data).then(resolve, reject).catch(reject);
				} else {
					reject(new Error('Permission not granted!'));
				}
			});
		} else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
			var textarea = document.createElement('textarea');
			textarea.textContent = text;
			textarea.style.position = 'fixed';
			textarea.style.width = '2em';
			textarea.style.height = '2em';
			textarea.style.padding = 0;
			textarea.style.border = 'none';
			textarea.style.outline = 'none';
			textarea.style.boxShadow = 'none';
			textarea.style.background = 'transparent';
			document.body.appendChild(textarea);
			textarea.focus();
			textarea.select();
			try {
				document.execCommand('copy');
				document.body.removeChild(textarea);
				resolve();
			} catch (e) {
				document.body.removeChild(textarea);
				reject(e);
			}
		} else {
			reject(new Error('None of copying methods are supported by this browser!'));
		}
	});
}

export let supplier_export = {
	DIGIKEY: {
		EXPORT: (order) => {
			console.log('EXPORT', order);
			let orderItems = order?.orders_items;
			const header =
				'Index,Quantity,Part Number,Manufacturer Part Number,Description,Customer Reference,Available,Backorder,Unit Price,Extended Price GBP';

			let csv = header + '\n';
			let items = [];
			orderItems?.forEach((i, idx) => {
				items.push([idx, i?.quantity, i?.spn, i?.part, '', order?.id]);
				csv += [idx, i?.quantity, i?.spn, i?.part, '', order?.id].join(',') + '\n';
			});
			downloadFileFromText(
				new Blob([csv], { type: 'text/plain;charset=utf-8' }),
				'Basket_DigiKey_' + (order?.id || new Date().toISOString()) + '.csv'
			);
		},
		CLIPBOARD: async (order) => {
			let csv = '';
			order?.orders_items?.forEach((i, idx) => {
				csv += [i?.quantity, i?.spn, ''].join(',') + '\n';
			});
			await copyToClipboard(csv);
			messagesStore('Copied basket to clipboard');
		}
	},
	FARNELL: {
		EXPORT: (order) => {
			console.log('EXPORT', order);
			let orderItems = order?.orders_items;
			const header = 'Part Number,Quantity,Line Note';

			let csv = header + '\n';
			orderItems?.forEach((i, idx) => {
				csv += [i?.spn, i?.quantity, ''].join(',') + '\n';
			});
			downloadFileFromText(
				new Blob([csv], { type: 'text/plain;charset=utf-8' }),
				'Basket_Farnell_' + (order?.id || new Date().toISOString())
			);
		},
		CLIPBOARD: async (order) => {
			let csv = '';
			order?.orders_items?.forEach((i, idx) => {
				csv += [i?.spn, i?.quantity, ''].join(',') + '\n';
			});
			await copyToClipboard(csv);
			messagesStore('Copied basket to clipboard');
		}
	},
	RS: {
		CLIPBOARD: async (order) => {
			let csv = '';
			order?.orders_items?.forEach((i, idx) => {
				csv += [i?.spn, i?.quantity, ''].join(',') + '\n';
			});
			await copyToClipboard(csv);
			messagesStore('Copied basket to clipboard');
		}
	}
};

export const clamp = (val: number, min: number, max: number): number => Math.min(Math.max(val, min), max);
export const replaceStateWithQuery = (values: Record<string, string>) => {
	const url = new URL(window.location.toString());
	for (let [k, v] of Object.entries(values)) {
		if (!!v) {
			url.searchParams.set(encodeURIComponent(k), encodeURIComponent(v).replaceAll('%252C', ','));
		} else {
			url.searchParams.delete(k);
		}
	}
	history.replaceState({}, '', url);
};

export function getSelectionText() {
	var text = '';
	if (window.getSelection) {
		text = window.getSelection().toString();
	} else if (document.selection && document.selection.type != 'Control') {
		text = document.selection.createRange().text;
	}
	return text;
}

export function deepEqual(x, y): boolean {
	const ok = Object.keys,
		tx = typeof x,
		ty = typeof y;
	return x && y && tx === 'object' && tx === ty
		? ok(x).length === ok(y).length && ok(x).every((key) => deepEqual(x[key], y[key]))
		: x === y;
}

export function isValidUrl(url_string: string) {
	try {
		new URL(String(url_string));
		return true;
	} catch (err) {
		return false;
	}
}

function getNextBusinessDay(date: Date | number) {
	date = new Date(+date);
	do {
		date.setDate(date.getDate() + 1);
	} while (!(date.getDay() % 6));
	return date;
}
