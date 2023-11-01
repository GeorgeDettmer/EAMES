<script lang="ts">
	import { page } from '$app/stores';
	import OrderOverview from '$lib/components/Orders/OrderOverview.svelte';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import type { PageData } from './$types';
	import OrdersListItem from '$lib/components/Orders/OrdersListItem.svelte';
	import UserIcon from '$lib/components/UserIcon.svelte';

	export let data: PageData;

	$: orderId = $page?.data?.orderId;
	let ordersStore;
	$: if (!orderId) {
		ordersStore = queryStore({
			client: getContextClient(),
			query: gql`
				query orders {
					erp_orders(order_by: { created_at: desc }) {
						id
						created_at
						jobs_orders {
							job {
								id
								batch
							}
						}
						orders_items {
							id
							tracking
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
								created_at
								updated_at
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
						supplier {
							id
							name
						}
						user_id
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
			`,
			variables: {}
		});
	}

	$: orders = $page?.data?.me
		? $ordersStore?.data?.erp_orders.filter((o) => o.user_id === $page?.data?.user?.id)
		: $ordersStore?.data?.erp_orders;
</script>

{#if orderId}
	<OrderOverview {orderId} />
{:else if orders}
	<div class="grid">
		{#each orders as order}
			<a href={window.origin + '/order/' + order?.id} target="_blank">
				<OrdersListItem {order}>
					<div class="ml-5 w-auto">
						<UserIcon size="xs" user={order?.user}>
							{order?.user?.first_name}
							{order?.user?.last_name}
						</UserIcon>
					</div>
				</OrdersListItem>
			</a>
		{/each}
	</div>
{/if}
