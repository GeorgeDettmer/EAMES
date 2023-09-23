<script lang="ts">
	import '../app.postcss';
	import { messagesStore } from 'svelte-legos';
	import { deserialize } from '$app/forms';
	import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import {
		Client,
		setContextClient,
		cacheExchange,
		fetchExchange,
		subscriptionExchange,
		mapExchange
	} from '@urql/svelte';
	import { devtoolsExchange } from '@urql/devtools';
	import { createClient as createWSClient } from 'graphql-ws';
	import {
		PUBLIC_HASURA_URL,
		PUBLIC_BARCODE_endKey,
		PUBLIC_BARCODE_startKey,
		PUBLIC_BARCODE_separator
	} from '$env/static/public';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const gqlUrl = PUBLIC_HASURA_URL;
	const gqlWs = 'ws://' + gqlUrl.split('://')[1];

	function getCookie(name: string) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		return parts?.pop()?.split(';')?.shift() ?? '';
	}

	//TODO: Use session/local storage for auth token to allow temporary user switch for firstoff etc
	const getToken = () =>
		decodeURI(sessionStorage.getItem('AuthorizationToken') || getCookie('AuthorizationToken'));

	const headers = {};
	if (getToken()) {
		headers['Authorization'] = getToken();
		headers['X-Hasura-Role'] = 'user';
	} else {
		headers['X-Hasura-Role'] = 'anonymous';
	}

	const wsClient = createWSClient({
		url: gqlWs,
		shouldRetry: () => true,
		connectionParams: () => {
			const token = getToken();
			if (!token) {
				return {
					headers: {
						'X-Hasura-Role': 'anonymous'
					}
				};
			}
			return {
				headers: {
					Authorization: token,
					'X-Hasura-Role': 'user'
				}
			};
		} /* {
			headers: headers
		} */,
		on: {
			error: (error) => {
				messagesStore('Websocket error: ' + error, 'error');
				console.error('Websocket error: ', error);
			},
			connected: (socket) => {
				console.info('Websocket connected: ', socket);
			},
			connecting: () => {
				console.info('Websocket connecting...');
			}
		}
	});
	const client = new Client({
		url: gqlUrl,
		exchanges: [
			cacheExchange,
			fetchExchange,
			subscriptionExchange({
				forwardSubscription(request) {
					const input = {
						...request,
						query: request.query || ''
					};
					return {
						subscribe(sink) {
							const unsubscribe = wsClient.subscribe(input, sink);
							return { unsubscribe };
						}
					};
				}
			}),
			devtoolsExchange,
			mapExchange({
				onError(error, operation) {
					messagesStore('Query error: ' + error, 'error');
					console.error(`The operation ${operation.key} has errored with:`, error);
				}
			})
		],
		fetchOptions: () => {
			const token = getToken();
			if (!token) {
				return {
					headers: {
						'X-Hasura-Role': 'anonymous'
					}
				};
			}
			return {
				headers: {
					Authorization: token,
					'X-Hasura-Role': 'user'
				}
			};
		}
	});

	setContextClient(client);

	import Navbar from '$lib/components/Navbar.svelte';
	import { fade } from 'svelte/transition';
	import type { ActionResult } from '@sveltejs/kit';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	const currentBoard = writable({});
	setContext('currentBoard', currentBoard);
	$: console.log('context', currentBoard);
	$: console.warn('HEADERS', headers);

	async function loginFromToken(token: string) {
		const data = new FormData();
		data.set('login_token', token);

		const response = await fetch('/login?/login', {
			method: 'POST',
			body: data
		});

		const result: ActionResult = deserialize(await response.text());
		console.log('LOGIN', result);
		if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
			await invalidateAll();
			messagesStore('Logged in as ' + $page?.data?.user?.username, 'success');
		} else {
			messagesStore(result?.error?.message || result?.data?.error, 'error');
		}
	}

	async function logout(redirect?: string) {
		const response = await fetch('/login?/logout', {
			method: 'POST',
			body: new FormData()
		});

		const result: ActionResult = deserialize(await response.text());
		console.log('LOGOUT', result);
		if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
			await invalidateAll();
			messagesStore('Logged out', 'success');
		} else {
			messagesStore(result?.error?.message || result?.data?.error, 'error');
		}
	}

	function handleBarcodeScan(barcode: string): void {
		if (barcode.startsWith('TOKEN')) {
			const token = barcode.split(keys.config.separator)?.[1];
			console.log('SCAN', 'TOKEN', token);
			if (token) {
				loginFromToken(token);
			}
			return;
		}
		if (barcode.startsWith('LOGOUT')) {
			console.log('SCAN', 'LOGOUT');
			logout();
			return;
		}
		const sn = parseInt(barcode);
		if (!sn) return;
		console.log('SCAN', 'BARCODE', barcode, sn);
		goto('/board/' + sn, { invalidateAll: true, replaceState: true });
	}
	let keys = {
		watching: false,
		timeStamp: 0,
		result: '',
		config: {
			startKey: PUBLIC_BARCODE_startKey,
			endKey: PUBLIC_BARCODE_endKey,
			separator: PUBLIC_BARCODE_separator
		}
	};
	function handleWindowKey(event) {
		const key = event.key;
		if (key === keys.config.startKey && !keys.watching) {
			keys.watching = true;
			keys.timeStamp = event.timeStamp;
			console.log('START CAPTURE', key, event.timeStamp);
		} else {
			if (key === keys.config.endKey && keys.timeStamp) {
				console.log('END CAPTURE', key, event.timeStamp, event.timeStamp - keys.timeStamp);
				console.log('OUTPUT:', keys.result);
				handleBarcodeScan(keys.result);
				keys.watching = false;
				keys.timeStamp = 0;
				keys.result = '';
			}
			if (
				keys.timeStamp &&
				new Set(
					'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ' +
						keys.config.startKey +
						keys.config.endKey
				).has(key)
			) {
				keys.result += key;
			}
		}
		if (keys.timeStamp && event.timeStamp - keys.timeStamp > 5000) {
			console.log('CAPTURE EXPIRED');
			keys.watching = false;
			keys.timeStamp = 0;
			keys.result = '';
		}
	}

	setContext('windowTitle', '');
</script>

<svelte:window on:keydown={handleWindowKey} />

<svelte:head>
	<script>
		if (window) {
			localStorage.getItem('color-theme') === 'dark' ||
			(!('color-theme' in localStorage) &&
				window.matchMedia('(prefers-color-scheme: dark)').matches)
				? window.document.documentElement.classList.add('dark')
				: window.document.documentElement.classList.remove('dark');

			let activityTimeout = localStorage.getItem('activityTimeout') || 30 * 60 * 1000;
		}
	</script>
	<title>EAMES {getContext('windowTitle')}</title>
</svelte:head>

<Navbar />

<main class="h-screen overflow-y-scroll dark:bg-slate-600">
	<div class="mx-auto max-w-8xl pt-14 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<div class="rounded-lg">
				<div in:fade|global={{ duration: 500 }}>
					<slot />
				</div>
			</div>
		</div>
	</div>
</main>
