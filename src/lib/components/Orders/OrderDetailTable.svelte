<script lang="ts">
	import { datetimeFormat, classes } from '$lib/utils';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Tooltip } from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import TrackingStatus from './TrackingStatus.svelte';

	export let orderIds: string[] = [];
	export let orders = [];
	export let hiddenColumns: ('supplier' | 'job' | 'user')[] = [];

	let ordersStore;
	$: if (orderIds.length > 0) {
		ordersStore = queryStore({
			client: getContextClient(),
			query: gql`
				query orders($idsCriteria: bigint_comparison_exp = {}) {
					erp_orders(order_by: { created_at: desc }, where: { id: $idsCriteria }) {
						id
						reference
						kb
						created_at
						jobs_orders {
							job {
								id
								batch
							}
						}
						orders_items_aggregate {
							aggregate {
								count
								sum {
									price
									quantity
								}
							}
						}
						orders_items {
							id
							tracking
							category
							created_at
							updated_at
							order_id
							part
							spn
							part_id
							partByPartId {
								description
								name
							}
							price
							currencyCode
							quantity
							order {
								id
								supplier {
									id
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
							orders_items_receiveds_aggregate {
								aggregate {
									sum {
										quantity
									}
								}
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
				idsCriteria: orderIds ? { _in: orderIds } : {}
			},
			requestPolicy: 'cache-and-network'
		});
	}

	$: orders = $ordersStore?.data?.erp_orders || orders;
</script>

<Table>
	<TableHead theadClass="text-xs uppercase text-center">
		{#if orderIds.length > 1}
			<TableHeadCell padding="px-1 py-1">Order</TableHeadCell>
		{/if}
		<TableHeadCell padding="px-1 py-1">Order Item</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">User</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Part</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Qty</TableHeadCell>
		{#if !hiddenColumns.includes('supplier')}
			<TableHeadCell padding="px-1 py-1">Supplier</TableHeadCell>
		{/if}

		<TableHeadCell padding="px-1 py-1">Cost</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Total</TableHeadCell>
		<TableHeadCell padding="px-1 py-1" />
	</TableHead>
	<TableBody>
		{#each orders as order}
			{@const orderItems = order.orders_items}
			{#each orderItems as item, idx}
				<TableBodyRow>
					{#if orders.length > 1}
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
							{#if item?.order?.id}
								<a href={`${window.origin}/order/${item?.order?.id}`} target="_blank" class={classes.link}>
									{item?.order?.id}
									{#if item?.order?.reference}
										({item?.order?.reference})
									{/if}
								</a>
							{:else}
								N/A
							{/if}
						</TableBodyCell>
					{/if}
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						<p class={'uppercase'}>
							{idx + 1}
						</p>
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						<UserIcon size="xs" user={order?.user} buttonClass="!p-0 !pr-2 text-white">
							{order?.user?.first_name}
							{order?.user?.last_name}
						</UserIcon>
						<Tooltip placement="left">
							<p>
								{#if item?.user?.first_name}
									{item?.user?.first_name}
									{item?.user?.last_name}
								{:else}
									Unknown user...
								{/if}
							</p>
							<p>{datetimeFormat(item.updated_at)}</p>
						</Tooltip>
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{item.part}
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{item?.quantity}
					</TableBodyCell>
					{#if !hiddenColumns.includes('supplier')}
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
							{item?.order?.supplier?.name || 'Unknown'}
						</TableBodyCell>
					{/if}
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: item?.currencyCode || 'GBP',
							roundingPriority: 'morePrecision'
						}).format(item?.price || 0)}
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: item?.currencyCode || 'GBP',
							roundingPriority: 'morePrecision'
						}).format(item?.price * item?.quantity || 0)}
					</TableBodyCell>

					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs">
						<div class="">
							{#each item?.tracking || [] as tracking}
								<TrackingStatus {tracking} showText={true} width={24} height={24} />
							{/each}
						</div>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		{:else}
			<TableBodyRow>
				<TableBodyCell colspan="8" tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">No receipts</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
