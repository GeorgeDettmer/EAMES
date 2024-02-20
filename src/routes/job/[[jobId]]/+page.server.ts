import { client } from '$lib/graphql';
import { gql } from '@urql/svelte';
import type { PageServerLoad } from '../$types';

export const load = (async ({ params, locals }) => {
	let jobs;
	console.log('params.jobId', params.jobId);
	let jobsQuery = await client.query(
		gql`
			query jobs {
				jobs(order_by: { id: desc, batch: asc }, limit: 500) {
					id
					batch
					quantity
					due_date
					reference
					customer {
						id
						name
					}
					assembly {
						id
						name
						revision_external
						revision_internal
						bom {
							id
							name
							revision_internal
							revision_external
						}
						assemblies_cad {
							id
							name
							revision_internal
							revision_external
						}
					}
				}
			}
		`,
		{}
	);
	jobs = jobsQuery.data?.jobs;
	let configQuery = client.query(
		gql`
			query config($names: [String!], $_or: [system_config_bool_exp!]) {
				system_config(where: { name: { _in: $names }, _or: $_or }, order_by: { user_id: asc_nulls_first }) {
					name
					type
					user_id
					json
				}
			}
		`,
		{
			names: ['purchasing', 'job'],
			_or: [locals?.user?.id ? { user_id: { _eq: locals?.user?.id } } : {}, { user_id: { _is_null: true } }]
		}
	);
	let configData = (await configQuery).data?.system_config;
	let config = {};
	configData?.forEach((item) => {
		config[`${item.name}_${item.type}`] = item?.json;
	});
	console.log('config', config);
	return {
		jobs,
		config
	};
}) satisfies PageServerLoad;
