<script lang="ts">
	import { datetimeFormat, classes, numberToLetter } from '$lib/utils';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Tooltip,
		Spinner,
		Badge
	} from 'flowbite-svelte';
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
							jobs_allocations {
								job_id
								job_batch
								quantity
							}
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
							orders_items_shipments {
								id
								quantity
								shipment {
									id
									expected_delivery_date
									confirmed_delivery_date
									carrier {
										id
										name
										image_url
									}
									tracking {
										id
										carrier_code
										tracking_number
										tracking_url
										status
									}
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

	$: console.log(orders[0]?.orders_items?.map((i) => i.orders_items_receiveds_aggregate?.aggregate?.sum?.quantity));
</script>

<Table>
	<TableHead theadClass="text-xs uppercase text-center">
		{#if orderIds.length > 1}
			<TableHeadCell padding="px-1 py-1">Order</TableHeadCell>
		{/if}
		<TableHeadCell padding="px-1 py-1">Order Item</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Buyer</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Category</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">PN</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">SPN</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Qty</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Allocations</TableHeadCell>
		{#if !hiddenColumns.includes('supplier')}
			<TableHeadCell padding="px-1 py-1">Supplier</TableHeadCell>
		{/if}

		<TableHeadCell padding="px-1 py-1">Cost</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Total</TableHeadCell>
		<TableHeadCell padding="px-1 py-1" />
		<TableHeadCell padding="px-1 py-1" />
	</TableHead>
	<TableBody>
		{#each orders as order (order.id)}
			{@const ordersItems = order.orders_items}
			{#each ordersItems as item, idx (item.id)}
				{@const receivedTotal = item?.orders_items_receiveds_aggregate?.aggregate?.sum?.quantity}
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
						<UserIcon size="xs" user={item?.user} buttonClass="!p-0 !pr-2 text-white" />
						<Tooltip placement="right">
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
						{item?.category || 'Unknown'}
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{item.part}
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{item.spn}
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{item?.quantity}
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						<div class="">
							{#each item?.jobs_allocations as allocation, idx}
								<div class="py-0.5">
									<div class="flex mx-auto w-fit rounded bg-slate-500">
										<!-- TODO: Replace badge so that layout is cleaner -->
										<Badge color="blue">
											<p class="text-left min-w-14">
												{allocation?.job_id}
												{#if allocation?.job_batch}
													({numberToLetter(allocation.job_batch - 1)})
												{/if}
											</p>
										</Badge>
										<p class="text-xs my-auto text-center font-semibold cursor-default min-w-8 text-white">
											{allocation?.quantity || item.quantity}
										</p>
									</div>
								</div>
							{:else}
								<div class="flex">
									<Badge color="dark">
										<p class="font-semibold uppercase text-xs">No allocation</p>
									</Badge>
								</div>
							{/each}
						</div>
					</TableBodyCell>
					{#if !hiddenColumns.includes('supplier')}
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
							{item?.order?.supplier?.name || 'Unknown'}
						</TableBodyCell>
					{/if}
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: item?.currencyCode || 'GBP'
							/* roundingPriority: 'morePrecision' */
						}).format(item?.price || 0)}
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: item?.currencyCode || 'GBP'
							/* roundingPriority: 'morePrecision' */
						}).format(item?.price * item?.quantity || 0)}
					</TableBodyCell>

					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs">
						<div class="space-y-1">
							<!-- {#each item?.tracking || [] as tracking}
								<TrackingStatus {tracking} showText={true} width={24} height={24} />
							{/each} -->
							{#each item?.orders_items_shipments as oi, idx}
								{@const shipment = oi?.shipment}
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div class="flex mx-auto w-fit rounded bg-slate-500">
									<!-- {#if shipments?.length > 1}
										<p class="text-xs text-white my-auto text-center font-semibold p-1 cursor-default min-w-4">
											{shipmentIdx + 1}
										</p>
									{/if} -->
									<!-- TODO: Replace badge so that layout is cleaner -->
									<Badge color={shipment?.confirmed_delivery_date ? 'green' : 'blue'}>
										<TrackingStatus tracking={shipment?.tracking} width={20} height={20} />
									</Badge>
									<!-- {#if oi?.quantity} -->
									<p class="text-xs my-auto text-center font-semibold p-1 cursor-default min-w-8 text-white">
										{oi?.quantity || item.quantity}
									</p>
									<!-- {/if} -->
								</div>
							{:else}
								<div class="flex mx-auto">
									<Badge color="dark">
										<p class="font-semibold uppercase text-xs">No shipment</p>
									</Badge>
								</div>
							{/each}
						</div>
					</TableBodyCell>

					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs">
						<div class="flex">
							{#if !receivedTotal}
								<img
									style="filter: brightness(0) saturate(10%) invert(30%) sepia(97%) saturate(600%) hue-rotate(350deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/ios/50/unpacking.png"
									alt="unpacking"
								/>
								<p class="font-semibold pt-1 pl-1 uppercase text-xs">Not Received</p>
							{:else if receivedTotal >= item?.quantity}
								<img
									style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/ios/50/unpacking.png"
									alt="unpacking"
								/>
								<p class="font-semibold pt-1 pl-1 uppercase text-xs">Received</p>
							{:else}
								<img
									style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(350deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/ios/50/unpacking.png"
									alt="unpacking"
								/>
								<p class="font-semibold pt-1 pl-1 uppercase text-xs">Partially Received</p>
							{/if}
						</div>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		{:else}
			<TableBodyRow>
				<TableBodyCell colspan="9" tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{#if $ordersStore?.fetching}
						<Spinner color="blue" size="4" />
					{:else}
						No order items...
					{/if}
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
