<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	import { AccordionItem, Accordion, Indicator } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import OrderOverview from '$lib/components/Orders/OrderOverview.svelte';
	import ReceivingOverview from '$lib/components/Receiving/ReceivingOverview.svelte';
	import OrdersListItem from '$lib/components/Orders/OrdersListItem.svelte';
	import JobOverview from '$lib/components/Job/JobOverview.svelte';

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
						bom {
							id
						}
						assemblies_cad {
							id
							data
							name
						}
					}
					customer {
						name
					}
					orders_items {
						id
						created_at
						order_id
						part
						part_id
						tracking
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
						orders_items_receiveds {
							id
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
								orders_items_receiveds {
									id
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
	$: orders = jobInfo?.jobs_orders || [];

	$: incompleteOrders = orders?.filter(
		(o) =>
			o?.orders_items?.filter((i) => i.quantity !== i.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0))
				?.length === 0
	);
	$: console.log('incompleteOrders', incompleteOrders);
</script>

{#if jobId}
	{#if jobId.startsWith('PO')}
		<OrderOverview orderId={jobId?.slice(2)} showRecieved />
	{:else if orders}
		{#if jobInfo}
			<JobOverview job={jobInfo}>
				<div class="pl-4">
					<div
						class:bg-red-600={incompleteOrders > 0}
						class="w-6 h-6 center rounded-full inline-flex items-center justify-center"
					>
						<p class="text-white">{incompleteOrders > 0 ? incompleteOrders : '✅'}</p>
					</div>
				</div>
			</JobOverview>
		{/if}

		<Accordion multiple flush>
			{#each orders as { order }}
				{@const linesToRecieve = order.orders_items?.filter(
					(i) => i.quantity !== i.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0)
				)?.length}
				<AccordionItem paddingFlush="p-0" paddingDefault="p-0">
					<div slot="header" class="grid grid-cols-2">
						<OrdersListItem {order}>
							<div class="pl-4">
								<div
									class:bg-red-600={linesToRecieve > 0}
									class="w-6 h-6 center rounded-full inline-flex items-center justify-center"
								>
									<p class="text-white">{linesToRecieve > 0 ? linesToRecieve : '✅'}</p>
								</div>
							</div>
						</OrdersListItem>
					</div>
					<div class="p-1">
						<OrderOverview orderId={order?.id} showRecieved showHeader={false} />
					</div>
				</AccordionItem>
			{/each}
		</Accordion>
	{:else}
		No orders for job {jobId}
	{/if}
{:else}
	<ReceivingOverview />
{/if}
