<script lang="ts">
	import { messagesStore } from "svelte-legos";
	import '../app.postcss';
	import { PUBLIC_HASURA_URL } from '$env/static/public';
	import type { LayoutData } from './$types';
	import { deserialize, enhance } from '$app/forms';
	export let data: LayoutData;
	import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	const gqlUrl = PUBLIC_HASURA_URL;
	const gqlHttp = 'http' + gqlUrl;
	const gqlWs = 'ws://' + gqlUrl.split('://')[1];
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
		connectionParams: {
			headers: headers
		},
		on: {
			error: (error) => {
				setContext('connectionError', error);
				alert = error;
			},
			connected: (socket) => {
				alert = null;
			}
		}
	});
	setContext('connectionError', null);
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
					console.error(`The operation ${operation.key} has errored with:`, error);
				}
			})
		],
		fetchOptions: () => {
			return {
				headers: headers
			};
		}
	});

	setContextClient(client);

	import Navbar from '$lib/components/Navbar.svelte';
	import { fade } from 'svelte/transition';
	import { FireOutline, InfoCircleSolid } from 'flowbite-svelte-icons';
	import { Alert, Button, Toast } from 'flowbite-svelte';
	import type { ActionResult } from '@sveltejs/kit';
	import { invalidateAll } from '$app/navigation';
	import { page } from "$app/stores";

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
			messagesStore("Logged in as " + $page?.data?.user?.username, "success");
		} else {
			messagesStore(result?.data?.error, "error");
		}
	}

	function handleBarcodeScan(barcode: string): void {
		const type: string = barcode.includes('|') ? barcode.split('|')?.[0]?.toUpperCase() : 'SN';
		console.log(type);
		if (type === 'TOKEN') {
			const token = barcode.split('|')?.[1];
			console.log('SCAN', 'TOKEN', token);
			if (token) {
				loginFromToken(token);
			}
		}
		if (type == 'SN') {
			//goto('/board/' + barcode);
			console.log('barcode', barcode);
		}
	}
	let keys = {
		timeStamp: 0,
		result: ''
	};
	function handleWindowKey(event) {
		const key = event.key;
		if (key === '~') {
			keys.timeStamp = event.timeStamp;
			console.log('START CAPTURE', key, event.timeStamp);
		} else {
			if (key === 'Enter' && keys.timeStamp) {
				console.log('END CAPTURE', key, event.timeStamp, event.timeStamp - keys.timeStamp);
				console.log('OUTPUT:', keys.result);
				handleBarcodeScan(keys.result);
				keys.timeStamp = 0;
				keys.result = '';
			}
			if (
				keys.timeStamp &&
				new Set('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ |').has(key)
			) {
				keys.result += key;
			}
		}
		if (keys.timeStamp && event.timeStamp - keys.timeStamp > 10000) {
			console.log('CAPTURE EXPIRED');
			keys.timeStamp = 0;
			keys.result = '';
		}
	}

	$: alert = getContext('connectionError');
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
			{#if alert}
				<Alert class="!items-start" color="red">
					<span slot="icon">
						<InfoCircleSolid slot="icon" class="w-4 h-4" />
						<span class="sr-only">Websocket connection error...</span>
					</span>
					<p class="font-medium">Websocket connection error...</p>
					{JSON.stringify(alert)}
				</Alert>
			{/if}

			<div class="rounded-lg">
				<div in:fade|global={{ duration: 500 }}>
					<slot />
				</div>
			</div>
		</div>
	</div>
</main>
<!-- {#if data.user}
	<span>{data.user.id}</span> - <span>{data.user.username}</span>
	<form method="POST" action="/login?/logout" use:enhance>
		<button type="submit" name="logout" value="true">Logout</button>
	</form>
{:else}
	<a href="/signup">Sign Up</a>
	<a href="/login">Log In</a>
{/if}

<p>{JSON.stringify(page.data?.user)}</p> -->
