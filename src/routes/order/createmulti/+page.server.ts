import { client } from '$lib/graphql';
import { gql } from '@urql/svelte';
import type { PageServerLoad } from './$types';
//TODO: Move to layout load
export const load = (async ({ locals }) => {
	let configQuery = client.query(
		gql`
			query config($name: String!, $_or: [system_config_bool_exp!]) {
				system_config(where: { name: { _eq: $name }, _or: $_or }, order_by: { user_id: asc_nulls_first }) {
					name
					type
					user_id
					json
				}
			}
		`,
		{
			name: 'purchasing',
			_or: [locals?.user?.id ? { user_id: { _eq: locals?.user?.id } } : {}, { user_id: { _is_null: true } }]
		}
	);
	let configData = (await configQuery).data?.system_config;
	let config = {};
	configData?.forEach((item) => {
		config[`${item.name}_${item.type}`] = item?.json;
	});
	console.log('config', config);
	return { config };
}) satisfies PageServerLoad;
