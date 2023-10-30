<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Badge,
		Input,
		Button,
		ButtonGroup,
		Dropdown,
		DropdownItem,
		Select
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';
	import { ChevronDownSolid, SearchOutline } from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import OrderOverview from './OrderOverview.svelte';
	import { goto } from '$app/navigation';

	export let order;
	export let user = order?.user;

	$: orderItems = order?.orders_items;
	$: totalOrdered = orderItems?.reduce((a, v) => a + v.quantity, 0);

	function remove(idx: number) {
		order.orders_items = orderItems.toSpliced(idx, 1);
	}
	const urqlClient = getContextClient();
	let orderAdding = false;
	async function addOrder() {
		if (orderAdding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (orderItems.length === 0) {
			messagesStore('There must be some order items to submit an order', 'warning');
			return;
		}
		/* if (!$page?.data?.user?.processes['eng']) {
			alert(
				`You do not have permission to insert components. You have permission for: ${Object.keys(
					$page?.data?.user?.processes
				)}`
			);
			return;
		} */
		orderAdding = true;
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertOrder($supplier_id: String!, $user_id: uuid!) {
					insert_erp_orders_one(object: { supplier_id: $supplier_id, user_id: $user_id }) {
						id
					}
				}
			`,
			{ supplier_id: order.supplier_id, user_id: order.user_id }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted order: ' + mutationResult?.data?.insert_erp_orders_one?.id, 'success');
		}
		if (mutationResult?.data?.insert_erp_orders_one?.id) {
			console.log('oo', orderItems);
			let items = orderItems;
			order.id = mutationResult?.data?.insert_erp_orders_one?.id;
			items.forEach((i) => {
				i.order_id = mutationResult?.data?.insert_erp_orders_one?.id;
			});
			mutationResult = await urqlClient.mutation(
				gql`
					mutation insertOrderItems($items: [erp_orders_items_insert_input!] = {}) {
						insert_erp_orders_items(objects: $items) {
							returning {
								id
							}
						}
					}
				`,
				{ items }
			);
		}
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			goto('/order/' + order.id, { invalidateAll: true, replaceState: true });
		}
		orderAdding = false;
	}

	$: suppliersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query suppliers {
				erp_suppliers(order_by: { orders_aggregate: { count: desc } }) {
					id
					name
				}
			}
		`,
		variables: {}
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers;
	$: console.log(suppliers);

	$: showSupplierSelect = false; //!order?.supplier_id;
	$: supplier = suppliers?.filter((s) => s.id === selectedSupplierId);

	let selectedSupplierId = suppliers?.[0]?.id;
	$: order.suppier_id;
	$: console.log(selectedSupplierId, supplier);
</script>

{#if order}
	<div class="grid grid-cols-2">
		<div class="flex">
			{#if showSupplierSelect}
				<div class="w-fit">
					<Select
						size="sm"
						placeholder=""
						items={suppliers?.map((s) => {
							return { value: s.id, name: s.name };
						})}
						bind:value={selectedSupplierId}
						on:change={() => {
							showSupplierSelect = false;
							order.supplier = suppliers?.filter((s) => s.id === selectedSupplierId)?.[0];
							order.supplier_id = order.supplier.id;
						}}
					/>
				</div>
			{:else}
				<div class="cursor-pointer" on:click={() => (showSupplierSelect = true)}>
					<OrdersListItem {order} interactive={false} />
				</div>
			{/if}
			<div class="pt-2 pl-2">
				<UserIcon size="sm" user={order?.user}>
					{order?.user?.first_name}
					{order?.user?.last_name}
				</UserIcon>
			</div>
		</div>
		<div class="flex">
			<div class="ml-auto my-auto">
				<Button
					color="green"
					size="sm"
					disabled={orderAdding}
					on:click={() => {
						addOrder();
					}}
				>
					Submit
				</Button>
			</div>
		</div>
	</div>
	{#if order?.id}
		<OrderOverview orderId={order.id} />
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell>User</TableHeadCell>
				<TableHeadCell>Time/Date</TableHeadCell>
				<!-- 			<TableHeadCell>Reference</TableHeadCell> -->
				<TableHeadCell>Part</TableHeadCell>
				<TableHeadCell>Order Qty</TableHeadCell>
				<TableHeadCell>Unit Cost</TableHeadCell>
				<TableHeadCell>Total Cost</TableHeadCell>
				<TableHeadCell>Tracking</TableHeadCell>
				<TableHeadCell />
				<slot name="head" />
			</TableHead>
			<TableBody>
				{#each orderItems as item, idx}
					<TableBodyRow class="p-0 object-right">
						<TableBodyCell tdClass="px-1 py-0 whitespace-nowrap font-sm ">
							<UserIcon size="xs" user={item?.user || order?.user}>
								{item?.user?.first_name || order?.user?.first_name}
								{item?.user?.last_name || order?.user?.last_name}
							</UserIcon>
						</TableBodyCell>
						<TableBodyCell>
							<p>{datetimeFormat(item.created_at)}</p>
						</TableBodyCell>
						<!-- 					<TableBodyCell>
						{item?.order?.supplier?.reference || ''}
					</TableBodyCell> -->
						<TableBodyCell>
							{item?.part || ''}
						</TableBodyCell>
						<TableBodyCell>
							<Badge class="mx-0.5" color={'blue'}>
								{item?.quantity}
							</Badge>
						</TableBodyCell>
						<TableBodyCell>
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(item?.price || 0)}
						</TableBodyCell>
						<TableBodyCell>
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
						</TableBodyCell>
						<TableBodyCell>
							<ButtonGroup size="sm">
								<Button
									size="sm"
									color="none"
									class="flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
								>
									<ChevronDownSolid class="w-2 h-2 ml-2 text-white dark:text-white" />
								</Button>
								<Dropdown>
									<DropdownItem>UPS</DropdownItem>
								</Dropdown>
								<Input type="text" placeholder="Tracking number" size="sm" />
								<!-- <Button color="primary" class="!p-2.5">
								<SearchOutline class="w-5 h-5" />
							</Button> -->
							</ButtonGroup>
						</TableBodyCell>
						<TableBodyCell>
							<span
								class="cursor-pointer"
								on:click={() => {
									remove(idx);
								}}
							>
								❌
							</span>
						</TableBodyCell>
						<slot name="body" />
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
					<Badge class="mx-0.5" color="blue">{totalOrdered}</Badge>
				</TableBodyCell>

				<TableBodyCell />
				<TableBodyCell>
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: 'GBP'
					}).format(orderItems?.reduce((a, v) => a + v.price * v.quantity, 0))}
				</TableBodyCell>
				<TableBodyCell />
				<TableBodyCell />
				<slot name="foot" />
			</TableHead>
		</Table>
	{/if}
{/if}
