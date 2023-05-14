import { HoudiniClient } from '$houdini';
import { createClient } from 'graphql-ws';
import { subscription } from '$houdini/plugins';
export default new HoudiniClient({
	url: 'https://easl-hasura-skqluw3.loca.lt/v1/graphql',
	plugins: [
		subscription(() =>
			createClient({
				url: 'ws://easl-hasura-skqluw3.loca.lt/v1/graphql'
			})
		)
	],
	// uncomment this to configure the network call (for things like authentication)
	// for more information, please visit here: https://www.houdinigraphql.com/guides/authentication
	fetchParams({ session }) {
		return {
			headers: {
				//Authentication: `Bearer ${session.token}`,
				'x-hasura-admin-secret': 'cMJvwCG29qElvQ8mnouvac8BBDI0dCJT'
			}
		};
	}
});
