<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import BomTable from '$lib/components/BOM/BomTable.svelte';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';

	$: bomId = $page?.data?.bomId;
	$: jobId = $page?.data?.jobId;

	$: jobInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription jobInfo($jobId: bigint!) {
				jobs_by_pk(id: $jobId) {
					quantity
					assembly {
						name
						revision_external
						revision_internal
					}
					kit {
						id
						created_at
						meta
						kits_items {
							id
							part_id
							quantity
							orders_item {
								id
								quantity
								price
								order {
									supplier {
										name
									}
								}
							}
						}
					}
				}
			}
		`,
		variables: { jobId }
	});
	$: jobInfo = $jobInfoStore?.data?.jobs_by_pk;
</script>

{#if jobId}
	<p>Job: {jobId} <em>({jobInfo?.quantity} boards)</em></p>

	<p>
		Kit: <a class="cursor-pointer" target="_blank" href={window.origin + '/kit/' + jobInfo?.kit?.id}>{jobInfo?.kit?.id}</a>
		<em>({jobInfo?.kit?.kits_items?.length} items)</em>
	</p>
{/if}
<BomTable {bomId} job={jobInfo} />
