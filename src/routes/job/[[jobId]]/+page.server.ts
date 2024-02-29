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

	return {
		jobs
	};
}) satisfies PageServerLoad;
