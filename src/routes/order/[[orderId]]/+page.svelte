<script lang="ts">
	import { page } from '$app/stores';
	import OrderOverview from '$lib/components/Orders/OrderOverview.svelte';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import type { PageData } from './$types';
	import OrdersListItem from '$lib/components/Orders/OrdersListItem.svelte';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import {
		Badge,
		Input,
		Label,
		Select,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Toggle,
		Tooltip
	} from 'flowbite-svelte';
	import { getJsonBySearchId } from 'serpapi';
	import TableHeadCollapsible from '$lib/components/Misc/Table/TableHeadCollapsible.svelte';
	import { writable } from 'svelte/store';
	import { storage } from 'svelte-legos';
	import { XMark } from 'svelte-heros-v2';
	import TableBodyCollapsible from '$lib/components/Misc/Table/TableBodyCollapsible.svelte';
	import { createEventDispatcher } from 'svelte';
	import { datetimeFormat, getSelectionText, padString } from '$lib/utils';
	import OrderItemsTable from '$lib/components/Kitting/OrderItemsTable.svelte';
	import ReceivingStatus from '$lib/components/Orders/ReceivingStatus.svelte';

	export let data: PageData;

	$: orderId = $page?.data?.orderId;
	let ordersStore;
	$: if (!orderId) {
		ordersStore = queryStore({
			client: getContextClient(),
			query: gql`
				query orders(
					$supplierIdCriteria: String_comparison_exp = {}
					$userIdCriteria: uuid_comparison_exp = {}
					$orderReferenceCriteria: String_comparison_exp = {}
				) {
					erp_orders(
						order_by: { created_at: desc }
						where: { supplier_id: $supplierIdCriteria, user_id: $userIdCriteria, reference: $orderReferenceCriteria }
					) {
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
							part_id
							partByPartId {
								description
								name
							}
							price
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
				supplierIdCriteria: selectedSupplierId ? { _eq: selectedSupplierId } : {},
				userIdCriteria: showMyOrdersOnly ? { _eq: $page?.data?.user?.id } : {},
				orderReferenceCriteria: orderReferenceSearch ? { _ilike: `%${orderReferenceSearch}%` } : {}
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
					orders_aggregate {
						aggregate {
							count
						}
					}
				}
			}
		`,
		variables: {}
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers || [];
	let selectedSupplierId = '';
	let showMyOrdersOnly = $page?.data?.me;
	let showIncompleteOnly = false;
	let showCompleteOnly = false;
	let orderReferenceSearch = '';
	$: console.log(selectedSupplierId);
	//TODO: Filter via query
	$: orders = showIncompleteOnly
		? $ordersStore?.data?.erp_orders.filter(
				(o) =>
					o.orders_items.filter((i) => i.orders_items_receiveds_aggregate.aggregate.sum.quantity !== i.quantity).length > 0
		  )
		: showCompleteOnly
		? $ordersStore?.data?.erp_orders.filter(
				(o) =>
					o.orders_items.filter((i) => i.orders_items_receiveds_aggregate.aggregate.sum.quantity !== i.quantity).length === 0
		  )
		: $ordersStore?.data?.erp_orders || [];

	const dispatch = createEventDispatcher();
	let openRows: number[] = [];
	function handleRowClick(idx: number, event: MouseEvent) {
		console.log('handleRowClick', idx, event);
		dispatch('row_click', { idx, event });
		if (getSelectionText()) return;
		if (openRows.includes(idx)) {
			openRows = openRows.filter((v) => v !== idx);
		} else {
			openRows = event.ctrlKey ? [...openRows, idx] : [idx];
		}
	}

	let collapsedColumns = storage(writable([]), 'EAMES_orders_collapsedColumns');
	let idSearch: string;
	let jobSearch: string;
	let supplierSearch: string;
</script>

{#if $suppliersStore?.error}
	{JSON.stringify($suppliersStore.error)}
{/if}

{#if orderId}
	<OrderOverview {orderId} />
{:else}
	<div class="grid grid-cols-6 mb-4">
		<div class="col-span-1 my-auto">
			<Toggle bind:checked={showMyOrdersOnly} color="blue">Show my orders</Toggle>
			<Toggle disabled={showCompleteOnly} bind:checked={showIncompleteOnly} color="blue">Show incomplete orders</Toggle>
			<Toggle disabled={showIncompleteOnly} bind:checked={showCompleteOnly} color="blue">Show complete orders</Toggle>
		</div>
		<div class="col-span-1">
			<Label for="small-input">Supplier</Label>
			<Select
				size="sm"
				placeholder=""
				items={[
					{ value: null, name: 'All' },
					...suppliers?.map((s) => ({ value: s.id, name: `${s.name}  (${s.orders_aggregate.aggregate.count})` }))
				]}
				bind:value={selectedSupplierId}
			/>
		</div>
		<div class="col-span-1">
			<Label for="small-input">Reference</Label>
			<Input size="md" placeholder="" bind:value={orderReferenceSearch} />
		</div>
		{#if $ordersStore?.fetching}
			<div class="my-auto pl-2">
				<Spinner color="blue" />
			</div>
		{/if}
	</div>

	{#if orders}
		<!-- <div class="grid grid-cols-2"> -->
		<Table shadow>
			<TableHead>
				<TableHeadCollapsible columnId="id" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
					<input
						class="block w-16 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={idSearch}
					/>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="flex my-auto hover:text-red-600" on:click={() => (idSearch = '')}>
						<XMark size="16" />
					</div>
				</TableHeadCollapsible>
				<TableHeadCollapsible columnId="job" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
					<input
						class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={jobSearch}
					/>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="flex my-auto hover:text-red-600" on:click={() => (jobSearch = '')}>
						<XMark size="16" />
					</div>
				</TableHeadCollapsible>
				<TableHeadCell />
				<!-- <TableHeadCollapsible columnId="buyer" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
					<input
						class="block text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={supplierSearch}
					/>
					<div class="flex my-auto hover:text-red-600" on:click={() => (supplierSearch = '')}>
						<XMark size="16" />
					</div>
				</TableHeadCollapsible> -->
				<TableHeadCollapsible columnId="category" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
					<input
						class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={supplierSearch}
					/>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="flex my-auto hover:text-red-600" on:click={() => (supplierSearch = '')}>
						<XMark size="16" />
					</div>
				</TableHeadCollapsible>
				<TableHeadCollapsible columnId="supplier" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
					<input
						class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={supplierSearch}
					/>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="flex my-auto hover:text-red-600" on:click={() => (supplierSearch = '')}>
						<XMark size="16" />
					</div>
				</TableHeadCollapsible>
				<TableHeadCollapsible columnId="orderdate" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
					<input
						class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={supplierSearch}
					/>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="flex my-auto hover:text-red-600" on:click={() => (supplierSearch = '')}>
						<XMark size="16" />
					</div>
				</TableHeadCollapsible>
				<TableHeadCell />
				<TableHeadCell />
			</TableHead>
			<TableHead>
				<TableHeadCollapsible columnId="id" bind:collapsedColumns={$collapsedColumns}>PO#</TableHeadCollapsible>
				<TableHeadCollapsible columnId="job" bind:collapsedColumns={$collapsedColumns}>Job(s)</TableHeadCollapsible>
				<TableHeadCollapsible columnId="buyer" bind:collapsedColumns={$collapsedColumns}>Buyer</TableHeadCollapsible>
				<TableHeadCollapsible columnId="category" bind:collapsedColumns={$collapsedColumns}>Categories</TableHeadCollapsible>
				<TableHeadCollapsible columnId="supplier" bind:collapsedColumns={$collapsedColumns}>Supplier</TableHeadCollapsible>
				<TableHeadCollapsible columnId="orderdate" bind:collapsedColumns={$collapsedColumns}>Created</TableHeadCollapsible>
				<TableHeadCollapsible columnId="total" bind:collapsedColumns={$collapsedColumns}>Total</TableHeadCollapsible>
				<TableHeadCollapsible columnId="status" bind:collapsedColumns={$collapsedColumns}>Status</TableHeadCollapsible>
			</TableHead>

			<TableBody>
				{#each orders as order, idx}
					{@const ordersTotalQty = order?.orders_items_aggregate?.aggregate?.sum?.quantity}
					{@const ordersTotalReceivedQty = order?.orders_items?.reduce(
						(a, v) => a + v.orders_items_receiveds_aggregate?.aggregate?.sum?.quantity,
						0
					)}
					{@const categories = order?.orders_items
						?.map((oi) => oi?.category || 'Unknown')
						?.filter((v, i, a) => a.indexOf(v) === i)}
					<TableBodyRow
						color={'default'}
						class={`cursor-pointer`}
						on:click={(e) => {
							handleRowClick(idx, e);
						}}
					>
						{@const jobsOrders = order?.jobs_orders || []}
						<TableBodyCollapsible columnId="id" bind:collapsedColumns={$collapsedColumns}>
							<p>
								{padString(String(order?.id))}
							</p>
						</TableBodyCollapsible>
						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="job"
							bind:collapsedColumns={$collapsedColumns}
						>
							<div class="grid grid-cols-2">
								{#each jobsOrders as jo}
									<div>
										<Badge color="blue">{jo?.job?.id}</Badge>
									</div>
								{/each}
							</div>
						</TableBodyCollapsible>
						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="buyer"
							bind:collapsedColumns={$collapsedColumns}
						>
							<UserIcon size="xs" user={order?.user} buttonClass="!p-0 !pr-2 text-white">
								{order?.user?.first_name}
								{order?.user?.last_name}
							</UserIcon>
						</TableBodyCollapsible>
						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="category"
							bind:collapsedColumns={$collapsedColumns}
						>
							<div class="grid grid-cols-2">
								{#each categories as category}
									<div>
										<Badge color="blue">{category}</Badge>
									</div>
								{:else}
									<div>
										<Badge color="blue">Unknown</Badge>
									</div>
								{/each}
							</div>
						</TableBodyCollapsible>
						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="supplier"
							bind:collapsedColumns={$collapsedColumns}
						>
							<p>{order?.supplier?.name}</p>
						</TableBodyCollapsible>
						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="orderdate"
							bind:collapsedColumns={$collapsedColumns}
						>
							<p>{datetimeFormat(order?.created_at)}</p>
						</TableBodyCollapsible>
						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="total"
							bind:collapsedColumns={$collapsedColumns}
						>
							<p>
								{new Intl.NumberFormat('en-GB', {
									style: 'currency',
									currency: 'GBP'
								}).format(order?.orders_items?.reduce((a, v) => a + v.price * v.quantity, 0))}
							</p>
						</TableBodyCollapsible>
						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="status"
							bind:collapsedColumns={$collapsedColumns}
						>
							<div class="flex">
								{#if ordersTotalReceivedQty >= ordersTotalQty || order?.received_at}
									<img
										style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
										width="24"
										height="24"
										src="https://img.icons8.com/windows/32/unpacking.png"
										alt="unpacking"
									/>
									<p class="font-semibold pt-1 pl-2 uppercase text-xs">Received</p>
								{:else if ordersTotalReceivedQty === 0}
									<img
										style="filter: brightness(0) saturate(10%) invert(30%) sepia(97%) saturate(600%) hue-rotate(350deg)"
										width="24"
										height="24"
										src="https://img.icons8.com/pastel-glyph/64/box--v4.png"
										alt="unpacking"
									/>
									<p class="font-semibold pt-1 pl-2 uppercase text-xs">Not Received</p>
								{:else if ordersTotalReceivedQty < ordersTotalQty}
									<img
										style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(350deg)"
										width="24"
										height="24"
										src="https://img.icons8.com/windows/32/unpacking.png"
										alt="unpacking"
									/>
									<p class="font-semibold pt-1 pl-2 uppercase text-xs">Partially Received</p>
								{/if}
							</div>
						</TableBodyCollapsible>
					</TableBodyRow>
					{#if openRows?.includes(idx)}
						<TableBodyRow class="h-24">
							<TableBodyCell colspan="8" class="p-0">
								<div class="px-1 py-1 mx-auto">
									<!-- TODO: Request when opening -->
									<OrderItemsTable orderItems={order?.orders_items} />
								</div>
							</TableBodyCell>
						</TableBodyRow>
					{/if}
					<!-- <div>
					<a href={window.origin + '/order/' + order?.id}>
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
				</div> -->
				{:else}
					<TableBodyRow class="h-24">
						<TableBodyCell colspan="7" class="p-0">
							<p>No orders matching search criteria</p>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
		<!-- </div> -->
	{/if}
{/if}
