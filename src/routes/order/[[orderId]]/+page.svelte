<script lang="ts">
	import { page } from '$app/stores';
	import OrderOverview from '$lib/components/Orders/OrderOverview.svelte';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import type { PageData } from './$types';
	import OrdersListItem from '$lib/components/Orders/OrdersListItem.svelte';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import { Label, Select, Toggle, Tooltip } from 'flowbite-svelte';
	import { getJsonBySearchId } from 'serpapi';

	export let data: PageData;

	$: orderId = $page?.data?.orderId;
	let ordersStore;
	$: if (!orderId) {
		ordersStore = queryStore({
			client: getContextClient(),
			query: gql`
				query orders($supplierIdCriteria: String_comparison_exp = {}, $userIdCriteria: uuid_comparison_exp = {}) {
					erp_orders(order_by: { created_at: desc }, where: { supplier_id: $supplierIdCriteria, user_id: $userIdCriteria }) {
						id
						kb
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
						supplier_id
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
			variables: {
				supplierIdCriteria: selectedSupplierId ? { _eq: selectedSupplierId } : {},
				userIdCriteria: showMyOrdersOnly ? { _eq: $page?.data?.user?.id } : {}
			},
			requestPolicy: 'cache-and-network'
		});
	}

	$: suppliersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query suppliers {
				erp_suppliers(order_by: { name: asc }) {
					id
					name
					names
				}
			}
		`,
		variables: {}
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers;
	let selectedSupplierId = null;
	let showMyOrdersOnly = $page?.data?.me;
	$: console.log(selectedSupplierId);
	$: orders = showMyOrdersOnly
		? $ordersStore?.data?.erp_orders.filter((o) => o.user_id === $page?.data?.user?.id)
		: $ordersStore?.data?.erp_orders;
</script>

{#if $suppliersStore.error}
	{JSON.stringify($suppliersStore.error)}
{/if}

{#if orderId}
	<OrderOverview {orderId} />
{:else if orders}
	<div class="grid grid-cols-6">
		<div class="col-span-1 my-auto">
			<Toggle bind:checked={showMyOrdersOnly} color="blue">Show my orders only</Toggle>
		</div>
		<div class="col-span-1">
			<Label for="small-input">Supplier</Label>
			<Select
				size="sm"
				placeholder=""
				items={[{ value: null, name: 'All' }, ...suppliers?.map((s) => ({ value: s.id, name: s.name }))]}
				bind:value={selectedSupplierId}
				on:change={() => {
					//showSupplierSelect = false;
					let supplier = suppliers?.filter((s) => s.id === selectedSupplierId)?.[0];
				}}
			/>
		</div>
	</div>

	<div class="grid grid-cols-2">
		{#each orders as order}
			{@const jobsOrders = order?.jobs_orders || []}
			<!-- {#if selectedSupplierId === null || selectedSupplierId === order.supplier_id} -->
			<div>
				<a href={window.origin + '/order/' + order?.id} target="_blank">
					<OrdersListItem {order}>
						<div class="ml-5 w-auto">
							<UserIcon size="xs" user={order?.user}>
								{order?.user?.first_name}
								{order?.user?.last_name}
							</UserIcon>
						</div>
						<div class="ml-5">
							{jobsOrders?.length}
						</div>
					</OrdersListItem>
					{#if jobsOrders?.length > 0}
						<Tooltip placement="right">
							{#each jobsOrders as jo}
								<p>{jo.job.id}</p>
							{/each}
						</Tooltip>
					{/if}
				</a>
			</div>
			<!-- {/if} -->
		{:else}
			<p>No orders found for your search criteria</p>
		{/each}
	</div>
{/if}
