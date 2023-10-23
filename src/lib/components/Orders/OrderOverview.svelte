<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Tooltip } from 'flowbite-svelte';
	import { mediaQuery } from 'svelte-legos';
	import UserIcon from '../UserIcon.svelte';

	export let orderId: number;

	$: orderStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order($orderId: bigint!) {
				erp_orders_by_pk(id: $orderId) {
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
		`,
		variables: { orderId }
	});
	$: order = $orderStore?.data?.erp_orders_by_pk;
	$: orderItems = order?.orders_items;

	$: console.log('order:', order);
</script>

{#if order}
	{order?.supplier?.name}
	{order?.id}
	<Table>
		<TableHead>
			<TableHeadCell>User</TableHeadCell>
			<TableHeadCell>Time/Date</TableHeadCell>
			<TableHeadCell>Reference</TableHeadCell>
			<TableHeadCell>Qty</TableHeadCell>
			<TableHeadCell>Cost</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each orderItems as item, idx}
				<TableBodyRow>
					<TableBodyCell>
						<UserIcon size="sm" user={item?.user}>
							{item?.user?.first_name}
							{item?.user?.last_name}
						</UserIcon>
					</TableBodyCell>
					<TableBodyCell>
						<p>{datetimeFormat(item.created_at)}</p>
					</TableBodyCell>
					<TableBodyCell>
						{item?.order?.supplier?.reference || ''}
					</TableBodyCell>
					<TableBodyCell>
						{item?.quantity}
					</TableBodyCell>

					<TableBodyCell>
						£{Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0}
					</TableBodyCell>
				</TableBodyRow>
			{:else}
				<TableBodyCell colspan="5">No items allocated to this order</TableBodyCell>
			{/each}
		</TableBody>
		<TableHead>
			<TableBodyCell />
			<TableBodyCell />
			<TableBodyCell />
			<TableBodyCell>
				{orderItems?.reduce((a, v) => a + v.quantity, 0)}
			</TableBodyCell>
			<TableBodyCell>
				£{orderItems?.reduce((a, v) => a + v.price * v.quantity, 0)}
			</TableBodyCell>
		</TableHead>
	</Table>
{/if}
