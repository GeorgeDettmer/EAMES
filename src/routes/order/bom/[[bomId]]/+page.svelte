<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import BomTable2 from '$lib/components/BOM/BomTable2.svelte';
	import OrdersList from '$lib/components/Orders/OrdersList.svelte';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Blockquote, Hr, P } from 'flowbite-svelte';

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
							id
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

	$: allOrderItems = jobInfo?.jobs_orders
		?.map(({ order }) => {
			return order?.orders_items;
		})
		?.flat();
</script>

{#if bom}
	<Blockquote border bg class="p-1 flex-auto mb-1 pb-2.5 " borderClass={`border-l-8 border-gray-400`}>
		<P weight="bold" size="lg">{bom?.name}</P>
		<P weight="medium" size="sm">{bom?.id} ({bom?.revision_internal}:{bom?.revision_external})</P>
		{#if jobId}
			<Hr />
			<p>{jobInfo?.customer?.name} {jobId}-{jobInfo?.batch} <em>({jobInfo?.quantity} boards)</em></p>
		{/if}
		{#if bom?.assemblies?.length > 0}
			{#each bom.assemblies as assembly, idx}
				<a class="cursor-pointer" target="_blank" href={window.origin + '/assembly/' + assembly?.id}>
					{idx + 1}: {assembly.name} ({assembly.revision_external}:{assembly.revision_internal})
				</a>
			{/each}
		{:else}
			<p>Not used in any assemblies</p>
		{/if}
	</Blockquote>
{/if}

<!-- {#if jobId}
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
{/if} -->

{#if jobInfo?.jobs_orders}
	<div class="flex">
		<div class="float-left">
			<OrdersList orders={jobInfo?.jobs_orders} />
		</div>
		<div class="w-auto ml-auto">
			<div
				class={'hover:shadow-lg m-1 h-12 w-auto p-4 rounded font-medium inline-flex items-center justify-center ' +
					(allOrderItems.length > 0
						? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 '
						: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 ')}
			>
				<div class="overflow-hidden grid grid-cols-2">
					<div>
						<p class="font-bold invisible">TOTAL</p>
					</div>
					<div>
						<p class="float-right" />
					</div>
					<div>
						<p>
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(allOrderItems?.reduce((a, v) => a + v.price * v.quantity, 0))}
						</p>
					</div>
					<div>
						<p class="float-right">{allOrderItems?.length || 0}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<p>No orders associated with this job</p>
{/if}

{#if bom}
	<BomTable2 {bom} job={jobInfo} />
{:else}
	<p>No BOM for bomId:{bomId}</p>
{/if}
