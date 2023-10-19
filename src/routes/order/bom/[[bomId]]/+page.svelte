<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import BomTable2 from '$lib/components/BOM/BomTable2.svelte';
	import OrdersList from '$lib/components/Orders/OrdersList.svelte';
	import { padString } from '$lib/utils.js';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';

	$: bomId = $page?.data?.bomId;
	$: jobId = $page?.data?.jobId;

	$: jobInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription jobInfo($jobId: bigint!) {
				jobs_by_pk(id: $jobId) {
					id
					quantity
					batch
					assembly {
						name
						revision_external
						revision_internal
						assemblies_cad {
							id
							data
							name
						}
					}
					customer {
						name
					}
					kit {
						id
						created_at
						meta
						kits_items(order_by: { updated_at: desc }) {
							id
							part_id
							quantity
							created_at
							updated_at
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
					orders_items {
						id
						created_at
						order_id
						part
						part_id
						partByPartId {
							description
							name
						}
						price
						quantity
						order {
							reference
							supplier {
								name
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
					jobs_orders {
						id
						order {
							orders_items {
								id
								created_at
								order_id
								part
								part_id
								partByPartId {
									description
									name
								}
								price
								quantity
								user {
									id
									username
									first_name
									last_name
									initials
									color
								}
							}
							id
							supplier {
								id
								name
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

	$: console.log('wag1:', jobInfo, bom);
</script>

{#if jobId}
	<p>Job: {jobInfo?.customer?.name} {jobId}-{jobInfo?.batch} <em>({jobInfo?.quantity} boards)</em></p>
	<p>
		{#if jobInfo?.kit}
			Kit: <a class="cursor-pointer" target="_blank" href={window.origin + '/kit/' + jobInfo?.kit?.id}>{jobInfo?.kit?.id}</a>
			<em>({jobInfo?.kit?.kits_items?.length} items)</em>
		{:else}
			No kit associated with job
		{/if}
	</p>
{/if}
{#if bom?.assemblies?.length > 0}
	<p>Used in {bom.assemblies.length} assemblies:</p>
	{#each bom.assemblies as assembly, idx}
		<a class="cursor-pointer" target="_blank" href={window.origin + '/assembly/' + assembly?.id}>
			{idx + 1}: {assembly.name} ({assembly.revision_external}:{assembly.revision_internal})
		</a>
	{/each}
{:else}
	<p>Not used in any assemblies</p>
{/if}
{#if jobInfo?.jobs_orders}
	<OrdersList orders={jobInfo?.jobs_orders} />
	<!-- <div class="flex-row">
		{#each jobInfo?.jobs_orders as order}
			{@const colour = 'blue'}
			<div
				class={`hover:shadow m-1 h-12 w-auto p-2 rounded font-medium inline-flex items-center justify-center bg-${colour}-100 text-${colour}-800 dark:bg-${colour}-900 dark:text-${colour}-300`}
			>
				<div class="overflow-hidden">
					<p>{order?.order?.supplier?.name} ({padString(String(order?.id))})</p>
					<p class="float-right">{order?.order?.orders_items?.length}</p>
				</div>
			</div>
		{/each}
	</div> -->
{:else}
	<p>No orders associated with this job</p>
{/if}

{#if bom}
	<BomTable2 {bom} job={jobInfo} />
{:else}
	<p>No BOM for bomId:{bomId}</p>
{/if}
