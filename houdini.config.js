/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
	watchSchema: {
		url: 'https://easl-hasura-8543.loca.lt/v1/graphql',
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
