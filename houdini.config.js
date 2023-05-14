/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
	/* schemaPath: './schema.graphql', */
	watchSchema: {
		url: 'https://easl-hasura-skqluw3.loca.lt/v1/graphql',
		interval: 5000,
		headers: {
			'x-hasura-admin-secret': 'cMJvwCG29qElvQ8mnouvac8BBDI0dCJT'
		}
	},
	plugins: {
		'houdini-svelte': {}
	},
	scalars: {
		bigint: {
			// <- The GraphQL Scalar
			type: 'number' // <-  The TypeScript type
		}
	},
	defaultCachePolicy: 'CacheAndNetwork'
};

export default config;
