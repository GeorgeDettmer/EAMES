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
					batch
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
									reference
									supplier {
										name
									}
								}
							}
							user {
								id
								username
								first_name
								last_name
								initials
								color
							}
						}
					}
				}
			}
		`,
		variables: { jobId }
	});
	$: jobInfo = $jobInfoStore?.data?.jobs_by_pk;

	$: bomStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription bom($bomId: uuid!) {
				bom_by_pk(id: $bomId) {
					id
					name
					revision_external
					revision_internal
					created_at
					updated_at
					lines(order_by: { part: asc_nulls_last, reference: asc_nulls_last }) {
						id
						reference
						part
						created_at
						updated_at
						partByPart {
							id
							name
							description
							manufacturer
							polarised
							properties
							created_at
							footprint
							image_url
							images
							kb
							updated_at
						}
					}
					assemblies {
						id
						name
						revision_external
						revision_internal
					}
				}
			}
		`,
		variables: { bomId }
	});
	$: bom = $bomStore?.data?.bom_by_pk;
</script>

{#if jobId}
	<p>Job: {jobId}/{jobInfo?.batch} <em>({jobInfo?.quantity} boards)</em></p>

	<p>
		Kit: <a class="cursor-pointer" target="_blank" href={window.origin + '/kit/' + jobInfo?.kit?.id}>{jobInfo?.kit?.id}</a>
		<em>({jobInfo?.kit?.kits_items?.length} items)</em>
	</p>
{/if}
{#if bom?.assemblies?.length > 0}
	<p>Used in {bom.assemblies.length} assemblies:</p>
	{#each bom.assemblies as assembly, idx}
		<p>{idx + 1}: {assembly.name} ({assembly.revision_external}:{assembly.revision_internal})</p>
	{/each}
{:else}
	<p>Not used in any assemblies</p>
{/if}
<BomTable {bom} job={jobInfo} />
