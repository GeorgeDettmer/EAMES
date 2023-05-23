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
</script>

<!-- <h1>Layout...</h1> -->
<slot />
