<script lang="ts">
	import type { Supplier } from '$lib/types';
	import { TableBodyRow, TableBodyCell, Hr, TableHeadCell, Table, TableHead, TableBody } from 'flowbite-svelte';
	import SupplierInfo from '$lib/components/Supplier/SupplierInfo.svelte';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { classes } from '$lib/utils';

	export let supplier: Supplier;

	$: supplierStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription supplier($id: String!) {
				erp_suppliers_by_pk(id: $id) {
					id
					name
					names
					created_at
					risk_level
					tags
					approved
					critical
					image_url
					user {
						username
						color
						first_name
						last_name
						initials
						id
					}
					userByApprovedUserId {
						username
						color
						first_name
						last_name
						initials
						id
					}
					orders_aggregate {
						aggregate {
							count
							max {
								created_at
							}
							min {
								created_at
							}
							sum {
								total
								items
							}
							avg {
								total
								items
							}
						}
					}
					orders(order_by: { created_at: desc }, limit: 25) {
						id
						items
						total
						user {
							id
							first_name
							last_name
							initials
							color
							username
						}
					}
				}
			}
		`,
		variables: { id: supplier.id }
	});
	$: supplierInfo = $supplierStore?.data?.erp_suppliers_by_pk || supplier;
	$: console.log(supplierInfo);
</script>

<TableBodyRow>
	<TableBodyCell tdClass="px-0 py-1" />
	<TableBodyCell colspan="2" tdClass="py-1">
		<div class=" space-y-2">
			<SupplierInfo supplier={supplierInfo} />
			<Table>
				<TableHead>
					<TableHeadCell padding="px-1 py-0" />
					<TableHeadCell padding="px-1 py-0">Total</TableHeadCell>
					<TableHeadCell padding="px-1 py-0">Avg</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow>
						<TableBodyCell tdClass="px-1 py-0.5 bg-gray-50 dark:bg-gray-700 uppercase font-bold text-xs text-right"
							>Value</TableBodyCell
						>
						<TableBodyCell tdClass="px-1 py-0.5">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(supplierInfo?.orders_aggregate?.aggregate?.sum?.total)}
						</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-0.5">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(supplierInfo?.orders_aggregate?.aggregate?.avg?.total)}
						</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell tdClass="px-1 py-0.5 bg-gray-50 dark:bg-gray-700 uppercase font-bold text-xs text-right"
							>Items</TableBodyCell
						>
						<TableBodyCell tdClass="px-1 py-0.5">
							{supplierInfo?.orders_aggregate?.aggregate?.sum?.items || 0}
						</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-0.5">
							{Math.round(supplierInfo?.orders_aggregate?.aggregate?.avg?.items)}
						</TableBodyCell>
					</TableBodyRow>
				</TableBody>
			</Table>
		</div>
	</TableBodyCell>
	<TableBodyCell colspan="6" tdClass="p-0" />
	<TableBodyCell colspan="4" tdClass="p-0">
		<div
			class="h-36 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-400 dark:scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700"
		>
			<Table>
				<TableHead>
					<TableHeadCell padding="px-1 py-1">Order#</TableHeadCell>
					<TableHeadCell padding="px-1 py-1">Items</TableHeadCell>
					<TableHeadCell padding="px-1 py-1">Total</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each supplierInfo?.orders || [] as order}
						<TableBodyRow>
							<TableBodyCell tdClass="py-0.5">
								<a href={'/order/' + order.id} class={classes.link}>{order.id}</a>
							</TableBodyCell>
							<TableBodyCell tdClass="py-0.5">
								{order?.items || 0}
							</TableBodyCell>
							<TableBodyCell tdClass="py-0.5">
								{new Intl.NumberFormat('en-GB', {
									style: 'currency',
									currency: 'GBP'
								}).format(order.total)}
							</TableBodyCell>
						</TableBodyRow>
					{:else}
						<TableBodyRow colspan="3">
							<TableBodyCell>No orders...</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	</TableBodyCell>
	<TableBodyCell colspan="1" tdClass="p-0" />
</TableBodyRow>
