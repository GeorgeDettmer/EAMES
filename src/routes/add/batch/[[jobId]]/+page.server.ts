import { client } from '$lib/graphql';
import { gql } from '@urql/svelte';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const jobId = Number(params?.jobId);
	let job;
	if (jobId) {
		console.log('params.jobId', jobId);
		let jobQuery = await client.query(
			gql`
				query job($jobId: bigint!) {
					jobs(where: { id: { _eq: $jobId } }) {
						id
						batch
						quantity
					}
				}
			`,
			{ jobId }
		);
		job = jobQuery?.data?.jobs?.[0];
	}
	console.log('job load:', job?.id, job?.batch);
	return {
		jobId,
		job
	};
}) satisfies PageServerLoad;
