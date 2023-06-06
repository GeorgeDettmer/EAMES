<script lang="ts">
	import { PUBLIC_HASURA_URL } from '$env/static/public';
	import type { LayoutData } from './$types';
	import { enhance } from '$app/forms';
	export let data: LayoutData;

	const gqlUrl = '://easl-hasura-skqluw3.loca.lt/v1/graphql';
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

	/* async function handleSignIn(id, options) {
		let response = await signIn(id, options);
		console.log(response);
	} */

	import { page } from '$app/stores';
</script>

<p>
	{#if data.user}
		<span>{data.user.id}</span> - <span>{data.user.username}</span>
		<form method="POST" action="/login?/logout" use:enhance>
			<button type="submit" name="logout" value="true">Logout</button>
		</form>
	{:else}
		<a href="/signup">Sign Up</a>
		<a href="/login">Log In</a>
	{/if}
</p>
<p>{JSON.stringify($page.data)}</p>
<slot />
