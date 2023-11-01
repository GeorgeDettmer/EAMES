<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	import { AccordionItem, Accordion, Button, TableBodyCell, TableHeadCell } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { padString } from '$lib/utils';
	import OrderOverview from '$lib/components/Orders/OrderOverview.svelte';
	import ReceivingOverview from '$lib/components/Receiving/ReceivingOverview.svelte';

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

	let expandedOrders: number[] = [];

	$: console.log('slice', jobId, jobId?.slice(2));
</script>

{#if jobId}
	{#if jobId.startsWith('PO')}
		<OrderOverview orderId={jobId?.slice(2)} showRecieved />
	{:else}
		<Accordion multiple flush>
			{#each orders as { order }}
				<AccordionItem open={expandedOrders.includes(order?.id)}>
					<span slot="header">{order?.supplier?.name} ({padString(String(order?.id), 5)})</span>
					<OrderOverview orderId={order?.id} showRecieved />
				</AccordionItem>
			{/each}
		</Accordion>
	{/if}
{:else}
	<ReceivingOverview />
{/if}
