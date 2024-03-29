<script lang="ts">
	import { datetimeFormat, deepEqual } from '$lib/utils';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Tooltip,
		Popover,
		Badge,
		Button,
		Modal,
		Alert,
		Spinner
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';

	import TrackingStatus from './TrackingStatus.svelte';
	import ReceivingStatus from './ReceivingStatus.svelte';
	import ReceiveQuantity from './ReceiveQuantity.svelte';
	import { mediaQuery, messagesStore } from 'svelte-legos';
	import { page } from '$app/stores';
	import PartInfo from '../PartInfo.svelte';
	import { goto } from '$app/navigation';
	import { EditOutline, InfoCircleSolid, XCircleOutline } from 'flowbite-svelte-icons';
	import List from '../KnowledgeBase/List.svelte';
	import OrderCreateMulti from './OrderCreateMulti.svelte';

	export let orderId: number;
	export let showRecieved: boolean = false;
	export let showHeader: boolean = true;

	$: orderStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order($orderId: bigint!) {
				erp_orders_by_pk(id: $orderId) {
					id
					kb
					reference
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
						spn
						category
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
		variables: { orderId }
	});
	let order;
	$: order = $orderStore?.data?.erp_orders_by_pk;
	$: orderItems = order?.orders_items;
	$: totalRecieved = orderItems?.reduce(
		(a1, item) => item?.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0) + a1,
		0
	);
	$: totalOrdered = orderItems?.reduce((a, v) => a + v.quantity, 0);

	$: console.log('order:', order);

	export let recieveModal = false;
	export let orderItemSelected = {};
	export let orderItemSelectedQty = 0;
	export let highlightOrderItem = {};
	export let highlightOrderItems = [];

	let trackings = [];

	let currentRowIdx;

	function tableKeypress(e: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }): any {
		console.log(e.key);
	}
	const urqlClient = getContextClient();

	async function removeRecieved(received) {
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
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
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation removeRecieved($id: uuid!) {
					delete_erp_orders_items_received_by_pk(id: $id) {
						id
					}
				}
			`,
			{ id: received?.id }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			recieveModal = false;
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Removed receipt: ' + mutationResult.data.delete_erp_orders_items_received_by_pk.id, 'success');
		}
	}

	async function removeLine(orderItem) {
		//orderItems[idx] = undefined;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
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
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation removeRecieved($id: uuid!) {
					delete_erp_orders_items_by_pk(id: $id) {
						id
					}
				}
			`,
			{ id: orderItem?.id }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Removed order line: ' + mutationResult.data.delete_erp_orders_items_by_pk.id, 'success');
		}
	}

	async function remove(order) {
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
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
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation removeOrder($id: bigint!) {
					delete_erp_orders_by_pk(id: $id) {
						id
					}
				}
			`,
			{ id: order?.id }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			if (mutationResult.data.delete_erp_orders_by_pk?.id) {
				messagesStore('Removed order: ' + mutationResult.data.delete_erp_orders_by_pk.id, 'success');
				goto('/order');
			} else {
				messagesStore('Failed order remove... Premission denied', 'warning');
			}
		}
	}

	let updating = false;
	let updateError = false;
	let updateSuccess = false;
	async function update(order) {
		console.log('update order...', order.id, order.orders_items.length);
		if (updating) return;
		//TODO: Fix quantity control
		/* if (recievedQty >= orderItem.quantity || recievedQty + quantity > orderItem.quantity) {
			messagesStore('Quantity over order total', 'warning');
			return;
		} */
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if ($page?.data?.user?.processes && !$page?.data?.user?.processes?.['purchase']) {
			messagesStore('You do not have permission to edit this order', 'warning');
			return;
		}

		updating = true;

		let updates = order.orders_items.map((oi) => {
			//if (oi?.id) {
			return {
				where: { _and: { id: { _eq: oi.id }, order_id: { _eq: order.id } } },
				_set: {
					part: oi.part,
					spn: oi.spn,
					quantity: oi.quantity,
					price: oi.price,
					category: oi.category
				}
			};
			//}
		});

		console.log('updates:', updates);

		let mutationResult;
		mutationResult = await urqlClient.mutation(
			gql`
				mutation updateOrder($updates: [erp_orders_items_updates!]!) {
					update_erp_orders_items_many(updates: $updates) {
						affected_rows
					}
				}
			`,
			{ updates }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
			updateError = true;
			setTimeout(() => {
				updateError = false;
			}, 5000);
		} else {
			editing = false;
			let affected = mutationResult.data.update_erp_orders_items_many.reduce((a, v) => v.affected_rows, 0);
			if (!affected) {
				console.error('MUTATION ERROR NO ROWS UPDATED: ', mutationResult);
				messagesStore('NO ROWS UPDATED, DO YOU HAVE PERMISSION?', 'warning');
				updateError = true;
				setTimeout(() => {
					updateError = false;
				}, 5000);
			} else {
				updateSuccess = true;
				setTimeout(() => {
					updateSuccess = false;
				}, 2500);
				console.log('MUTATION RESULT: ', mutationResult);
				messagesStore('Updated ' + affected + ' rows', 'success');
			}
		}
		updating = false;
	}

	let orderDeleteModal = false;
	let orderLineDeleteModal = false;
	let orderLineDelete = {};

	let kbItems;

	let editing = false;

	let editingOrder;

	$: editingDiff = []; //diff(editingOrder?.orders_items || [], order?.orders_items || []);
	$: changes = deepEqual(editingOrder?.orders_items || [], order?.orders_items || []);
	//$: console.log('changes', changes, editingOrder?.orders_items, order?.orders_items);
</script>

<Modal autoclose bind:open={recieveModal}>
	{@const recievedQty = orderItemSelected?.orders_items_receiveds?.reduce((a, v) => a + (v?.quantity || 0), 0)}
	<div>
		<div class="grid grid-cols-2">
			<div>
				<p>{orderItemSelected?.part}</p>
				{#if orderItemSelected?.spn}
					<p>{orderItemSelected?.spn}</p>
				{/if}
			</div>
			<ReceiveQuantity
				orderItemId={orderItemSelected?.id}
				quantity={orderItemSelectedQty}
				orderItem={orderItemSelected}
				bind:recieveModal
			/>
		</div>

		<PartInfo partId={orderItemSelected?.part} />
		{#if orderItemSelected?.orders_items_receiveds}
			<div class="mt-6">
				<Table>
					<TableHead theadClass="uppercase text-center">
						<TableHeadCell>User</TableHeadCell>
						<TableHeadCell>Time/Date</TableHeadCell>
						<TableHeadCell>Quantity</TableHeadCell>
						<TableHeadCell />
					</TableHead>

					{#each orderItemSelected?.orders_items_receiveds as received, idx}
						<TableBodyRow>
							<TableBodyCell tdClass="font-sm text-center">
								<UserIcon size="xs" user={received?.user}>
									{#if mediaQuery('(min-width: 1024px)')}
										{received?.user?.username || 'Unknown'}
									{/if}
								</UserIcon>
								<Tooltip placement="right">
									{#if received?.user?.first_name}
										{received?.user?.first_name}
										{received?.user?.last_name}
									{:else}
										Unknown user...
									{/if}
								</Tooltip>
							</TableBodyCell>
							<TableBodyCell tdClass="font-sm text-center">
								{datetimeFormat(received.updated_at)}
							</TableBodyCell>
							<TableBodyCell tdClass="font-sm text-center">
								{received?.quantity}
							</TableBodyCell>
							<TableBodyCell tdClass="font-sm text-center">
								<span
									class="cursor-pointer"
									on:click={() => {
										//orderItemSelected.orders_items_receiveds[idx] = undefined;
										removeRecieved(received);
									}}
								>
									❌
								</span>
							</TableBodyCell>
						</TableBodyRow>
					{:else}
						<TableBodyCell colspan="3">No receipts for this order item</TableBodyCell>
					{/each}
					<TableHead>
						<TableBodyCell />
						<TableBodyCell />
						<TableBodyCell tdClass="font-sm text-center font-bold">
							{recievedQty}/{orderItemSelected?.quantity}
						</TableBodyCell>
						<TableBodyCell />
					</TableHead>
				</Table>
			</div>
		{/if}
	</div>
</Modal>

<Modal outsideclose autoclose size="sm" bind:open={orderDeleteModal}>
	<div class="flex pt-6">
		<Button
			color="red"
			on:click={() => {
				remove(order);
			}}
		>
			Delete
		</Button>
		<Alert class="!items-start" color="red">
			<span slot="icon">
				<InfoCircleSolid slot="icon" class="w-4 h-4" />
				<span class="sr-only">Warning</span>
			</span>
			<p class="font-semibold">This will delete this order & all {order.orders_items?.length} order lines permanently</p>

			{#if orderItems?.filter((i) => i.orders_items_receiveds?.length > 0)?.length > 0}
				<p class="font-medium">
					This will also delete receipts for {orderItems?.filter((i) => i.orders_items_receiveds?.length)?.length} order lines
				</p>
			{/if}
		</Alert>
	</div>
</Modal>

<Modal outsideclose autoclose size="sm" bind:open={orderLineDeleteModal}>
	<div class="flex pt-6">
		<Button
			color="red"
			on:click={() => {
				removeLine(orderLineDelete);
			}}
		>
			Delete
		</Button>
		<Alert class="!items-start" color="red">
			<span slot="icon">
				<InfoCircleSolid slot="icon" class="w-4 h-4" />
				<span class="sr-only">Warning</span>
			</span>
			<p class="font-bold text-lg">This will delete this order line from the order permanently</p>

			{#if orderLineDelete.orders_items_receiveds?.length > 0}
				<p class="font-semibold">
					This will also delete {orderLineDelete.orders_items_receiveds?.length} receipts for this order line
				</p>
			{/if}
		</Alert>
	</div>
</Modal>

{#if order}
	{#if showHeader}
		<div class="grid grid-cols-2">
			<div class="flex">
				<div>
					<OrdersListItem {order} interactive={false}>
						<div class="pl-4 cursor-pointer">
							<button
								on:click={() => {
									if (editing) {
										editing = false;
										editingOrder = undefined;
									} else {
										editingOrder = structuredClone(order);
										editingOrder.id = undefined;
										editing = true;
									}
									console.log('edit', editingOrder);
								}}
							>
								{#if editing}
									<XCircleOutline size="lg" />
								{:else}
									<EditOutline size="lg" />
								{/if}
							</button>
							{#if editing}
								<button>
									<img
										width="22"
										height="22"
										src="https://img.icons8.com/ios/50/save--v1.png"
										alt="save"
										class="{updating && 'animate-pulse '}{updateSuccess && ' bg-green-400 rounded-md '}{updateError &&
											' bg-red-500 rounded-md '}"
										on:click|preventDefault={(e) => {
											update({ ...editingOrder, id: order.id });
											console.log('save');
										}}
									/>
								</button>
							{/if}
						</div>
					</OrdersListItem>
				</div>
				<div class="pt-2 pl-2">
					<UserIcon size="sm" user={order?.user}>
						{order?.user?.first_name}
						{order?.user?.last_name}
					</UserIcon>
				</div>
			</div>
			<div class="my-auto ml-auto">
				{#each order?.jobs_orders as { job }}
					<a
						class="m-1 h-12 w-auto p-4 rounded font-medium inline-flex items-center justify-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
						href={window.origin + '/receiving/' + (job?.id || '')}
					>
						<div class="overflow-hidden grid grid-cols-2 gap-x-2">
							<div>
								<p class="font-bold">{job?.id}</p>
							</div>
							<div>
								<p class="float-right" />
							</div>
							<div>
								<p />
							</div>
							<div>
								<p class="float-right">{order?.jobs_orders?.length}</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}
	<div on:keydown={(e) => tableKeypress(e)}>
		{#if editing}
			<OrderCreateMulti order={editingOrder} />
		{:else}
			<Table>
				<TableHead>
					<TableHeadCell>#</TableHeadCell>
					<TableHeadCell>Buyer</TableHeadCell>
					<TableHeadCell>Part</TableHeadCell>
					<TableHeadCell>Order Qty</TableHeadCell>
					<TableHeadCell>Unit Price</TableHeadCell>
					<TableHeadCell>Total Price</TableHeadCell>
					<TableHeadCell />
					<TableHeadCell />
					{#if showRecieved}
						<TableHeadCell>Received Qty</TableHeadCell>
					{/if}
					<TableHeadCell>
						<Button
							disabled={!order?.orders_items
								?.flat()
								?.map((i) => i?.user?.id)
								?.includes($page?.data?.user?.id) && order?.user?.id !== $page?.data?.user?.id}
							on:click={() => {
								orderDeleteModal = true;
							}}
						>
							❌
						</Button>
						<Button
							on:click={() => {
								if (editing) {
									editing = false;
									editingOrder = undefined;
								} else {
									editingOrder = order;
									editingOrder.id = undefined;
									editing = true;
								}
								console.log('edit', editingOrder);
							}}
						>
							<EditOutline class="text-gray-500" />
						</Button>
					</TableHeadCell>
					<slot name="head" />
				</TableHead>
				<TableBody>
					{#each orderItems as item, idx}
						{@const recievedQty = item?.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0)}
						<TableBodyRow
							class="p-0 object-right"
							color={false
								? 'blue'
								: recievedQty > 0 && recievedQty < item?.quantity
								? 'yellow'
								: recievedQty >= item?.quantity
								? 'green'
								: 'default'}
						>
							<TableBodyCell>
								<p>{idx + 1}</p>
							</TableBodyCell>
							<TableBodyCell>
								<UserIcon size="xs" user={item?.user}>
									{#if item?.user}
										{item?.user?.first_name}
										{item?.user?.last_name}
									{:else}
										Unknown
									{/if}
								</UserIcon>
								<Popover>
									<p class="text-xs italic">{datetimeFormat(item.created_at)}</p>
								</Popover>
							</TableBodyCell>
							<TableBodyCell>
								<div
									class={highlightOrderItem?.id === item?.id ||
									highlightOrderItems?.filter((i) => i?.id === item?.id)?.length > 0
										? 'bg-blue-500 p-0.5 border rounded'
										: ''}
								>
									<p>{item?.part}</p>
									{#if item?.spn}
										<p class="text-xs italic">{item?.spn}</p>
									{/if}
								</div>
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
								{#if item?.tracking?.length > 0}
									{#each item?.tracking || [item?.tracking?.[0]] as t}
										<TrackingStatus tracking={t} bind:trackingResult={trackings[idx]} />
									{/each}
								{:else}
									<TrackingStatus bind:trackingResult={trackings[idx]} />
								{/if}
							</TableBodyCell>
							<TableBodyCell>
								<ReceivingStatus order={item} receiveds={item?.orders_items_receiveds} />
							</TableBodyCell>
							{#if showRecieved}
								{@const remaining = item?.quantity - recievedQty}

								<TableBodyCell>
									<span
										class="cursor-pointer"
										on:click={() => {
											orderItemSelectedQty = remaining;
											orderItemSelected = item;
											recieveModal = true;
										}}
									>
										<Badge class="mx-0.5" color={!recievedQty ? 'red' : item?.quantity === recievedQty ? 'green' : 'yellow'}>
											{recievedQty}
										</Badge>
										<!-- <Badge
									class="mx-0.5"
									color={item?.quantity === 0 ? 'red' : item?.quantity === recievedQty ? 'green' : 'yellow'}
								>
									<span class="mr-1">➖</span>{recievedQty}<span class="ml-1">➕</span>
								</Badge> -->
										{#if item?.quantity !== recievedQty}
											<span> ➕ </span>
										{/if}
									</span>
								</TableBodyCell>
							{/if}
							<TableBodyCell>
								<Button
									disabled={item?.user?.id !== $page?.data?.user?.id && order?.user?.id !== $page?.data?.user?.id}
									on:click={() => {
										orderLineDeleteModal = true;
										orderLineDelete = item;
									}}
								>
									❌
								</Button>
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
					<TableBodyCell>
						<TrackingStatus isDelivered={trackings.filter((t) => t?.statusCode === 'DE').length === orderItems.length} />
					</TableBodyCell>
					<TableBodyCell>
						<ReceivingStatus isReceived={totalRecieved === totalOrdered} />
					</TableBodyCell>
					{#if showRecieved}
						<TableBodyCell>
							<Badge class="mx-0.5" color={!totalRecieved ? 'red' : totalOrdered === totalRecieved ? 'green' : 'yellow'}>
								{totalRecieved}
							</Badge>
						</TableBodyCell>
					{/if}
					<TableBodyCell />
					<slot name="foot" />
				</TableHead>
			</Table>
		{/if}
	</div>
	{#if order?.kb}
		<div class="mt-4">
			{#if kbItems}
				<p>Notes:</p>
			{/if}
			<List kbId={order?.kb} bind:kbItems />
		</div>
	{/if}
{:else}
	<p>No order info</p>
{/if}
