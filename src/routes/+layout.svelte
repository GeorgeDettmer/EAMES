<script lang="ts">
	import '../app.postcss';
	import { PUBLIC_HASURA_URL } from '$env/static/public';
	import type { LayoutData } from './$types';
	import { enhance } from '$app/forms';
	export let data: LayoutData;

	const gqlUrl = PUBLIC_HASURA_URL;
	const gqlHttp = 'http' + gqlUrl;
	const gqlWs = 'ws://' + gqlUrl.split('://')[1];
	import {
		Client,
		setContextClient,
		cacheExchange,
		fetchExchange,
		subscriptionExchange
	} from '@urql/svelte';
	import { devtoolsExchange } from '@urql/devtools';
	import { createClient as createWSClient } from 'graphql-ws';

	function getCookie(name: string) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		return parts?.pop()?.split(';')?.shift() ?? '';
	}
	const getToken = () =>
		decodeURI(sessionStorage.getItem('AuthorizationToken') || getCookie('AuthorizationToken'));
	console.log(getToken());
	const wsClient = createWSClient({
		url: gqlWs,
		connectionParams: {
			headers: { Authorization: `${getToken()}`, 'X-Hasura-Role': 'user' }
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
			devtoolsExchange
		],
		fetchOptions: () => {
			const token = getToken();
			return {
				headers: {
					Authorization: token ? `${token}` : ''
				}
			};
		}
	});

	setContextClient(client);

	import { page } from '$app/stores';
	import { Alert } from 'flowbite-svelte';

	import Navbar from '$lib/components/Navbar.svelte';
	import { fade } from 'svelte/transition';
</script>

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
</svelte:head>

<Navbar />

<main class="h-screen overflow-y-scroll dark:bg-slate-600">
	<div class="mx-auto max-w-8xl pt-12 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<div class="rounded-lg border-4 border-dashed border-grey-400">
				<div in:fade={{ duration: 500 }}>
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
