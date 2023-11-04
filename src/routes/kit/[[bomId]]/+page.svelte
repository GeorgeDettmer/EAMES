<script lang="ts">
	export let data;
	import { page } from '$app/stores';
	import PartInfo from '$lib/components/PartInfo.svelte';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { slide } from 'svelte/transition';

	$: kitId = $page?.data?.kitId;

	$: kitInfoStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription kitInfo($kitId: uuid!) {
				erp_kits_by_pk(id: $kitId) {
					id
					created_at
					updated_at
					meta
					kits_items(order_by: { part_id: asc_nulls_last }) {
						id
						created_at
						updated_at
						quantity
						part_id
						part {
							id
						}
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
					}
				}
			}
		`,
		variables: { kitId }
	});
	$: kitInfo = $kitInfoStore?.data?.erp_kits_by_pk;
	let openRow: number;

	let suppliersList = new Map();
	$: {
		kitInfo?.kits_items?.forEach((i) => {
			let supplier = i.orders_item?.order?.supplier?.name || 'Unknown';
			if (!suppliersList.has(supplier)) {
				suppliersList.set(supplier, 1);
			} else {
				let count = suppliersList.get(supplier);
				suppliersList.set(supplier, count + 1);
			}
		});
		console.log(suppliersList);
	}
</script>

{#if $kitInfoStore.error}
	<p>Error: {$kitInfoStore.error.name}</p>
	<pre>{JSON.stringify($kitInfoStore.error, null, 2)}</pre>
{:else if !$kitInfoStore.data}
	<p>Loading...</p>
{:else if kitInfo}
	<!-- <pre>{JSON.stringify(bom, null, 2)}</pre> -->
	<p>
		Items: {kitInfo?.kits_items?.length || 0}
	</p>
	<p>
		Kit value total: £{kitInfo?.kits_items?.reduce(
			(accumulator, currentValue) => accumulator + (currentValue?.orders_item?.price || 0) * currentValue?.quantity,
			0
		) || 0}
	</p>
	<p>
		Suppliers: {[...suppliersList.entries()]}
	</p>

	<Table hoverable={true}>
		<TableHead>
			<TableHeadCell>#</TableHeadCell>
			<TableHeadCell>Part</TableHeadCell>
			<TableHeadCell>Qty</TableHeadCell>
			<TableHeadCell>Supplier</TableHeadCell>
			<TableHeadCell>Cost Total</TableHeadCell>
		</TableHead>
		<TableBody class="divide-y">
			{#each kitInfo?.kits_items || [] as item, idx}
				<TableBodyRow
					class="cursor-pointer"
					on:click={() => {
						if (!item?.part?.id) return;
						openRow = openRow === idx ? null : idx;
					}}
				>
					<TableBodyCell>{idx + 1}</TableBodyCell>
					<TableBodyCell>{item?.part_id}</TableBodyCell>
					<TableBodyCell>{item?.quantity}</TableBodyCell>
					<TableBodyCell>{item?.orders_item?.order?.supplier?.name || 'Unknown'}</TableBodyCell>
					<TableBodyCell>£{item?.orders_item?.price * item?.quantity || '-.-'}</TableBodyCell>
				</TableBodyRow>
				{#if openRow === idx}
					<TableBodyRow>
						<TableBodyCell colspan="3" class="p-0">
							<div class="px-2 py-3" transition:slide={{ duration: 300, axis: 'y' }}>
								<PartInfo partId={item?.part_id} />
							</div>
						</TableBodyCell>
						<TableBodyCell colspan="2" class="p-0 object-right">
							<div class="" transition:slide={{ duration: 300, axis: 'y' }}>
								<p>
									{item.id}: {item.part_id} ({item.quantity}) [{item?.orders_item?.order?.supplier?.name
										? `${item?.orders_item?.order?.supplier?.name}:${item?.orders_item?.order?.reference}`
										: 'Unknown Supplier'}]
								</p>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/if}
			{/each}
		</TableBody>
	</Table>
{/if}
