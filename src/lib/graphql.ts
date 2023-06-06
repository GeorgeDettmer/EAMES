import { Client, fetchExchange } from '@urql/core';

export const client = new Client({
	url: 'http://192.168.1.221:8080//v1/graphql',
	exchanges: [fetchExchange],
	fetchOptions: () => {
		return {
			headers: {
				'x-hasura-admin-secret': 'cMJvwCG29qElvQ8mnouvac8BBDI0dCJT'
			}
		};
	}
});
