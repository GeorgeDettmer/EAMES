<script lang="ts">
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const gqlUrl = '://192.168.1.221:8080//v1/graphql';
	const gqlHttp = 'http' + gqlUrl;
	const gqlWs = 'ws' + gqlUrl;
	import {
		Client,
		setContextClient,
		cacheExchange,
		fetchExchange,
		subscriptionExchange
	} from '@urql/svelte';
	import { devtoolsExchange } from '@urql/devtools';
	import { createClient as createWSClient } from 'graphql-ws';
	const getToken = () => `cMJvwCG29qElvQ8mnouvac8BBDI0dCJT`;

	const wsClient = createWSClient({
		url: gqlWs,
		connectionParams: {
			headers: { 'x-hasura-admin-secret': getToken() }
		}
	});
	const client = new Client({
		url: gqlHttp,
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
					//authorization: token ? `Bearer ${token}` : '',
					'x-hasura-admin-secret': token
				}
			};
		}
	});

	setContextClient(client);

	import { signIn, signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
</script>

<h1>SvelteKit Auth Example</h1>
<p>
	{#if $page.data.session}
		{#if $page.data.session.user?.image}
			<span style="background-image: url('{$page.data.session.user.image}')" class="avatar" />
		{/if}
		<span class="signedInText">
			<small>Signed in as</small><br />
			<strong>{$page.data.session.user?.name ?? '#User'}</strong>
		</span>
		<button on:click={() => signOut()} class="button">Sign out</button>
	{:else}
		<span class="notSignedInText">You are not signed in</span>
		<button on:click={() => signIn('Credentials')}>Sign In with Credentials</button>
	{/if}
</p>
<slot />
