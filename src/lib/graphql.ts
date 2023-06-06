import { HASURA_URL } from '$env/static/private';
import { Client, fetchExchange } from '@urql/core';

export const client = new Client({
	url: HASURA_URL,
	exchanges: [fetchExchange],
	fetchOptions: () => {
		return {
			headers: {
				'x-hasura-admin-secret': 'cMJvwCG29qElvQ8mnouvac8BBDI0dCJT'
			}
		};
	}
});
