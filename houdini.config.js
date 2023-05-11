/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
	/* schemaPath: './schema.graphql', */
	watchSchema: {
		url: 'http://192.168.1.221:8080/v1/graphql',
		interval: 5000
	},
	plugins: {
		'houdini-svelte': {}
	},
	scalars: {
		/* in your case, something like */
		bigint: {
			// <- The GraphQL Scalar
			type: 'number' // <-  The TypeScript type
		}
	}
};

export default config;
