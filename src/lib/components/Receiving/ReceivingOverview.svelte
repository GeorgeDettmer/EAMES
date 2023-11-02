<script lang="ts">
	import { padString } from '$lib/utils';
	import { queryStore, getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Accordion, AccordionItem, Toggle } from 'flowbite-svelte';
	import OrderOverview from '../Orders/OrderOverview.svelte';
	import OrdersListItem from '../Orders/OrdersListItem.svelte';

	$: ordersStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription orders {
				erp_orders(where: { orders_items_aggregate: { count: { predicate: { _gt: 0 } } } }, order_by: { id: desc }) {
					id
					reference
					created_at
					supplier {
						name
					}
					user {
						id
						first_name
						last_name
						initials
						color
					}
					jobs_orders {
						job_id
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
						orders_items_receiveds {
							quantity
						}
					}
				}
			}
		`,
		variables: {}
	});
	$: orders = $ordersStore?.data?.erp_orders;
	$: ordersFiltered = incompleteFilter
		? orders?.filter(
				(o) =>
					o.orders_items?.filter((i) => i.quantity !== i.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0))
						?.length !== 0
		  )
		: orders;

	let incompleteFilter = true;
</script>

<Toggle color="blue" bind:checked={incompleteFilter}>Show incomplete only</Toggle>
<div class="p-4">
	{#if orders}
		<Accordion multiple flush>
			{#each ordersFiltered as order}
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
						<OrderOverview orderId={order?.id} showRecieved showHeader={true} />
					</div>
				</AccordionItem>
			{/each}
		</Accordion>
	{/if}
</div>
