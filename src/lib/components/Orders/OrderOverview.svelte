<script lang="ts">
	import { datetimeFormat, numberToLetter, padString } from '$lib/utils';
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
		Label,
		Spinner,
		Checkbox
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';
	import OrderStatus from './OrderStatus.svelte';
	import TrackingStatus from './TrackingStatus.svelte';
	import ReceivingStatus from './ReceivingStatus.svelte';
	import ReceiveQuantity from './ReceiveQuantity.svelte';
	import { mediaQuery, messagesStore } from 'svelte-legos';
	import { page } from '$app/stores';
	import PartInfo from '../PartInfo.svelte';
	import { goto } from '$app/navigation';
	import {
		CheckOutline,
		DotsHorizontalOutline,
		DotsVerticalOutline,
		EditOutline,
		InfoCircleSolid,
		PlusOutline,
		TicketOutline,
		XCircleOutline
	} from 'flowbite-svelte-icons';
	import List from '../KnowledgeBase/List.svelte';
	import OrderAddLine from '$lib/components/Orders/OrderAddLine.svelte';
	import OrderEditLine from '$lib/components/Orders/OrderEditLine.svelte';
	import { Plus } from 'svelte-heros-v2';
	import OrderSetTrackingBulk from './OrderSetTrackingBulk.svelte';
	import OrderShipments from './OrderShipment.svelte';
	import ShipmentAllocationsEdit from '../Shipment/ShipmentAllocationsEdit.svelte';
	import OrderShipment from './OrderShipment.svelte';
	import { enhance } from '$app/forms';
	import type { Shipment } from '$lib/types';
	import SupplierInfo from '../Supplier/SupplierInfo.svelte';
	import History from '../Misc/History/History.svelte';

	export let orderId: number;
	export let showRecieved: boolean = false;
	export let showHeader: boolean = true;

	let allShipmentsStore;
	$: if (addShipmentVisible) {
		allShipmentsStore = queryStore({
			client: getContextClient(),
			query: gql`
				query allShipments($_nin: [bigint!] = []) {
					erp_shipments(limit: 500, order_by: { id: desc }, where: { id: { _nin: $_nin } }) {
						id
						tracking_id
						carrier_id
						expected_delivery_date
						confirmed_delivery_date
						confirmed_delivery_user_id
						created_at
						updated_at
						tracking {
							id
							carrier_code
							tracking_number
							tracking_url
							status
							estimated_delivery_date
							delivery_date
							created_at
							ship_date
							updated_at
							events
						}
						carrier {
							id
							name
							image_url
						}
					}
				}
			`,
			variables: { _nin: ($shipmentsStore?.data?.erp_shipments || [])?.map((s) => s.id) }
		});
	}
	$: allShipments = $allShipmentsStore?.data?.erp_shipments || [];
	/*
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
					orders_items(order_by: { created_at: asc_nulls_last }) {
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
*/
	$: shipmentsStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription shipments($orderId: bigint!) {
				erp_shipments(
					where: { orders_items_shipments: { orders_item: { order_id: { _eq: $orderId } } } }
					order_by: { id: asc }
				) {
					id
					tracking_id
					carrier_id
					expected_delivery_date
					confirmed_delivery_date
					confirmed_delivery_user_id
					userByConfirmedDeliveryUserId {
						id
						username
						initials
						first_name
						last_name
						color
					}
					created_at
					updated_at
					orders_items_shipments {
						orders_item {
							part
							spn
							category
							quantity
							order_id
							updated_at
							user {
								id
								initials
								first_name
								last_name
								color
							}
						}
						quantity
					}
					tracking {
						id
						carrier_code
						tracking_number
						tracking_url
						status
						estimated_delivery_date
						delivery_date
						created_at
						ship_date
						updated_at
						events
					}
					carrier {
						id
						name
						image_url
					}
					user {
						id
						initials
						first_name
						last_name
						color
					}
				}
			}
		`,
		variables: { orderId }
	});
	let availableShipments = [];
	//$: shipments = [...($shipmentsStore?.data?.erp_shipments || []), ...availableShipments];
	$: shipments = $shipmentsStore?.data?.erp_shipments || [];

	$: orderStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order($orderId: bigint!) {
				erp_orders_by_pk(id: $orderId) {
					id
					kb
					reference
					price
					jobs_orders {
						job {
							id
							batch
						}
					}
					orders_items(order_by: { created_at: asc_nulls_last }) {
						id
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
						currencyCode
						jobs_allocations {
							id
							job_id
							job_batch
							quantity
						}
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
						orders_items_shipments {
							id
							quantity
							updated_at
							created_at
							shipment {
								id
								expected_delivery_date
								confirmed_delivery_date
								updated_at
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
					supplier {
						id
						name
						names
						user_id
						tags
						image_url
						categories
						url
						risk_level
						critical
						approved
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
	$: jobs_allocations = orderItems?.flatMap((oi) => oi?.jobs_allocations || []);

	$: unique_jobs_allocations = jobs_allocations?.filter(
		(v, i, s) => i === s.findIndex((p) => p?.job_id === v?.job_id && p?.job_batch === v?.job_batch)
	);
	$: console.log('allocations:', jobs_allocations, unique_jobs_allocations);

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

	let addLineModal = false;
	let editLineModal = false;
	let editTrackingModal = false;
	let editShipmentAllocationsModal = false;
	let editLine = null;
	let orderDeleteModal = false;
	let orderLineDeleteModal = false;
	let orderLineDelete = {};
	$: console.log('editLine', editLine);
	let kbItems;

	export let editable = false;
	$: console.log('shipments', shipments, $shipmentsStore);

	let selectedShipmentIdx: number | undefined = undefined;
	let selectedAllocationIdx: number | undefined = undefined;

	let addShipmentVisible = false;
	let addShipmentSelected = allShipments?.[0];

	$: console.log('order', order);

	let showOrderEdit = false;
	let showOrderEditSave = false;
</script>

{#if editable}
	<Modal bind:open={addLineModal} size="md" outsideclose>
		<OrderAddLine {order} />
	</Modal>
	<Modal bind:open={editLineModal} on:close={() => (editLine = null)} size="md" outsideclose>
		<OrderEditLine bind:line={editLine} bind:shipments />
	</Modal>
	<Modal bind:open={editShipmentAllocationsModal} on:close={() => (editLine = null)} size="md" outsideclose>
		<ShipmentAllocationsEdit bind:orderItem={editLine} bind:allocations={editLine.orders_items_shipments} bind:shipments />
	</Modal>
	<Modal bind:open={editTrackingModal} size="lg" outsideclose>
		<div class="pt-8">
			<OrderSetTrackingBulk orders_items={order.orders_items} />
		</div>
	</Modal>
{/if}

<Modal autoclose bind:open={recieveModal}>
	{@const recievedQty = orderItemSelected?.orders_items_receiveds?.reduce((a, v) => a + (v?.quantity || 0), 0)}
	{@const shipmentAllocations = orderItemSelected?.orders_items_shipments || []}
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

		<!-- <div class="mt-6">
			<Table>
				<TableHead theadClass="uppercase text-center">
					<TableHeadCell>Shipment</TableHeadCell>
					<TableHeadCell>Time/Date</TableHeadCell>
					<TableHeadCell>Job</TableHeadCell>
					<TableHeadCell>Allocation Qty</TableHeadCell>
				</TableHead>

				{#each shipmentAllocations as allocation, idx}
					{@const shipment = allocation?.shipment}
					<TableBodyRow>
						<TableBodyCell tdClass="font-sm text-center">
							<div class="flex">
								<p>SHP{shipment?.id}</p>
								<OrderStatus shipments={[shipment]} />
							</div>
							 <UserIcon size="xs" user={shipment?.user}>
									{#if mediaQuery('(min-width: 1024px)')}
										{orderItem?.user?.username || 'Unknown'}
									{/if}
								</UserIcon>
								<Tooltip placement="right">
									{#if orderItem?.user?.first_name}
										{orderItem?.user?.first_name}
										{orderItem?.user?.last_name}
									{:else}
										Unknown user...
									{/if}
								</Tooltip>
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							{datetimeFormat(allocation?.updated_at)}
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							 <a href={`${window.origin}/order/${orderItem.order.id}`} target="_blank" class={classes.link}>
								{orderItem.order.id}
							</a>
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							{allocation?.quantity || orderItemSelected?.quantity}
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">{receivedQty}</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">{kittedQty}</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							<div
								class="w-1/2 mx-auto"
								on:mousewheel={(e) => {
									orderItem.__quantity = clamp(
										orderItem.__quantity + (e.deltaY > 0 ? -1 : +1),
										1,
										orderItem.quantity - kittedQty
									);
								}}
							>
								<Input
									size="sm"
									type="number"
									value={orderItem.__quantity}
									disabled={!orderItem?.__selected}
									on:input={(e) => {
										orderItem.__selected = true;
										orderItem.__quantity = clamp(Number(e.target.value), 1, orderItem.quantity - kittedQty);
									}}
								/>
							</div>
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							{#if orderItem?.__kitted}
								<Checkbox checked={orderItem.__kitted} disabled={orderItem.__kitted} color="green" />
							{:else}
								<Checkbox bind:checked={orderItem.__selected} disabled={orderItem.__kitted} />
							{/if}
						</TableBodyCell>
					</TableBodyRow>
				{:else}
					<TableBodyCell colspan="3">No linked orders for this line</TableBodyCell>
				{/each}
				<TableHead>
					<TableBodyCell />
					<TableBodyCell />
					<TableBodyCell />
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{orderTotal}
					</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center font-bold">{receivedTotal}</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{kitItems?.reduce((a, v) => (a = a + v.quantity), 0)}
					</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{kittingTotal}
					</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{orderItems?.filter((i) => i?.__selected).length}
					</TableBodyCell>
				</TableHead>
			</Table>
		</div> -->

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
		<div class="flex">
			<div class="flex-col">
				<div class="flex">
					<OrdersListItem {order} interactive={false}>
						<button
							class="-mt-6 pl-2"
							on:click={() => {
								showOrderEdit = !showOrderEdit;
							}}
						>
							{#if showOrderEdit}
								<DotsVerticalOutline size="xs" />
							{:else}
								<DotsHorizontalOutline size="xs" />
							{/if}
						</button>
						{#if showOrderEdit}
							<div class="flex" on:click|stopPropagation={() => {}}>
								<div class="w-24 my-auto ml-2">
									<label class="text-xs">Reference:</label>
									<input
										type="text"
										class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-0.5"
										placeholder="Reference"
										bind:value={order.reference}
										on:input={() => {
											showOrderEditSave = true;
										}}
									/>
								</div>
								{#if showOrderEditSave}
									<div class="pl-1 my-auto">
										<form
											class="inline-flex gap-x-2"
											method="POST"
											action="/order?/updateOrder"
											use:enhance
											on:submit|preventDefault={(e) => {
												console.warn(e);
												showOrderEditSave = false;
												showOrderEdit = false;
											}}
										>
											<input type="hidden" name="order_id" bind:value={order.id} />
											<input type="hidden" name="reference" bind:value={order.reference} />
											<button>
												<img
													style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
													width="20"
													height="20"
													src="https://img.icons8.com/ios/50/save--v1.png"
													alt="save"
													class="opacity-50 hover:opacity-100"
												/>
											</button>
										</form>
									</div>
								{/if}
							</div>
						{/if}
					</OrdersListItem>
					<div class="pl-2 my-auto">
						<UserIcon size="sm" user={order?.user}>
							{order?.user?.first_name}
							{order?.user?.last_name}
						</UserIcon>
					</div>
				</div>
			</div>
			<div class="flex-col my-auto ml-auto">
				<div class="flex gap-x-2">
					<div class="p-1 outline outline-1 rounded outline-gray-400 relative">
						<div class="absolute -top-3 bg-white dark:bg-slate-600 dark:text-white text-black rounded">
							<p class="text-xs px-0.5">Shipments</p>
						</div>
						<div class="flex flex-wrap">
							{#each shipments as shipment, idx}
								<div class="px-0.5">
									<!-- svelte-ignore a11y-no-static-element-interactions -->
									<div
										class="flex rounded {selectedShipmentIdx === idx ? 'bg-green-500' : 'bg-slate-500'}"
										on:mouseenter={() => (selectedShipmentIdx = idx)}
										on:mouseleave={() => (selectedShipmentIdx = undefined)}
									>
										{#if shipments?.length > 1}
											<p class="my-auto text-center text-white font-semibold w-4">{idx + 1}</p>
										{/if}
										<OrderShipments {shipment} showItems popover={false} allowEdit />
									</div>
								</div>
							{:else}
								<div class="flex rounded bg-orange-500 p-2 gap-x-2">
									<img
										style="filter: brightness(0) saturate(100%) invert(90%) sepia(97%) saturate(925%) hue-rotate(360deg)"
										width="20"
										height="20"
										src="https://img.icons8.com/ios/50/cardboard-box.png"
										alt="box-other"
									/>
									<p class="my-auto text-center text-white font-semibold uppercase">No shipments</p>
								</div>
							{/each}
						</div>
					</div>
					<div class="p-1 outline outline-1 rounded outline-gray-400 relative">
						<div class="absolute -top-3 bg-white dark:bg-slate-600 dark:text-white text-black rounded">
							<p class="text-xs px-0.5">Allocations</p>
						</div>
						<div class="flex flex-wrap">
							{#each unique_jobs_allocations as allocation, idx}
								<div class="px-0.5">
									<!-- svelte-ignore a11y-no-static-element-interactions -->
									<div
										class="flex rounded {selectedAllocationIdx === idx ? 'bg-green-500' : 'bg-slate-500'}"
										on:mouseenter={() => (selectedAllocationIdx = idx)}
										on:mouseleave={() => (selectedAllocationIdx = undefined)}
									>
										{#if unique_jobs_allocations?.length > 1}
											<p class="my-auto text-center text-white font-semibold w-4">{idx + 1}</p>
										{/if}
										<div
											class="h-12 w-auto p-2 rounded font-medium inline-flex items-center justify-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
										>
											<div class="overflow-hidden">
												<div>
													<p class="font-bold">
														{allocation?.job_id}
														{#if allocation?.job_batch}
															({numberToLetter(allocation.job_batch - 1)})
														{/if}
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							{:else}
								<div class="flex rounded bg-orange-500 p-1 h-full w-28">
									<p class="my-auto text-center text-sm text-white font-semibold uppercase whitespace-break-spaces">
										No allocations
									</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	<div>
		<Table>
			<TableHead>
				<TableHeadCell padding="px-3 py-1">#</TableHeadCell>
				<TableHeadCell padding="px-3 py-1">Buyer</TableHeadCell>
				<TableHeadCell padding="px-3 py-1">Category</TableHeadCell>
				<TableHeadCell padding="px-3 py-1">Part</TableHeadCell>
				<TableHeadCell padding="px-3 py-1">Order Qty</TableHeadCell>
				<TableHeadCell padding="px-3 py-1">Allocations</TableHeadCell>
				<TableHeadCell padding="px-3 py-1">Unit Price</TableHeadCell>
				<TableHeadCell padding="px-3 py-1">Total Price</TableHeadCell>
				<TableHeadCell padding="px-3 py-1">
					<div class="flex">
						<p class="my-auto">Shipments</p>
						<!-- {#if editable}
							<Button
								on:click={() => {
									editTrackingModal = true;
								}}
							>
								<EditOutline />
							</Button>
						{/if} -->
					</div>
				</TableHeadCell>
				<TableHeadCell padding="px-3 py-1" />
				{#if showRecieved}
					<TableHeadCell padding="px-3 py-1">Received Qty</TableHeadCell>
				{/if}
				<TableHeadCell padding="px-3 py-1">
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
				</TableHeadCell>
				<slot name="head" />
			</TableHead>
			<TableBody>
				{#each orderItems as item, idx}
					{@const recievedQty = item?.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0)}
					{@const shipmentsQty = item?.orders_items_shipments?.reduce((a, v) => a + v.quantity, 0)}
					{@const allocationsQty = item?.jobs_allocations?.reduce((a, v) => a + v.quantity, 0)}
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
						<TableBodyCell tdClass="pl-3 px-2 py-1 whitespace-nowrap font-medium">
							<p>{idx + 1}</p>
						</TableBodyCell>
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
							<div class="flex cursor-default mx-auto">
								<UserIcon size="xs" user={item?.user} buttonClass="!p-0 !pr-2 text-white" />
								<Popover defaultClass="p-1" placement="right">
									<div class="text-xs italic text-center" class:hidden={item?.__hasHistory}>
										<p>
											{#if item?.user}
												{item?.user?.first_name}
												{item?.user?.last_name}
											{:else}
												Unknown
											{/if}
										</p>
										<p>{datetimeFormat(item.created_at)}</p>
									</div>
									<div class="p-2">
										<History schema="erp" table="orders_items" id={item.id} bind:hasHistory={item.__hasHistory} />
									</div>
								</Popover>
							</div>
						</TableBodyCell>
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
							<p>{item?.category || 'Unknown'}</p>
						</TableBodyCell>
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
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
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
							<Badge class="mx-0.5" color={'blue'}>
								{item?.quantity}
							</Badge>
						</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
							<div class="">
								<!-- {#each item?.tracking || [] as tracking}
									<TrackingStatus {tracking} showText={true} width={24} height={24} />
								{/each} -->
								{#each item?.jobs_allocations as allocation, idx}
									{@const allocationIdx = unique_jobs_allocations?.findIndex(
										(a) => a?.job_id === allocation?.job_id && a?.job_batch === allocation?.job_batch
									)}
									<div class="py-0.5 mx-auto">
										<div
											class="flex w-fit rounded {selectedAllocationIdx === allocationIdx
												? 'bg-green-500'
												: allocation?.quantity && allocationsQty !== item.quantity
												? 'bg-red-600'
												: 'bg-slate-500'}"
											on:mouseenter={() => (selectedAllocationIdx = allocationIdx)}
											on:mouseleave={() => (selectedAllocationIdx = undefined)}
										>
											<!-- {#if shipments?.length > 1}
											<p class="text-xs text-white my-auto text-center font-semibold p-1 cursor-default min-w-4">
												{shipmentIdx + 1}
											</p>
										{/if} -->
											<!-- TODO: Replace badge so that layout is cleaner -->
											<Badge color="blue">
												<p class="text-left min-w-14">
													{allocation?.job_id}
													{#if allocation?.job_batch}
														({numberToLetter(allocation.job_batch - 1)})
													{/if}
												</p>
											</Badge>
											<!-- {#if oi?.quantity} -->
											<p class="text-xs my-auto text-center font-semibold p-1 cursor-default min-w-8 text-white">
												{allocation?.quantity || item.quantity}
											</p>
											<!-- {/if} -->
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
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(item?.price || 0)}
						</TableBodyCell>
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
						</TableBodyCell>
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
							<div class="flex">
								<div class="space-y-1 my-auto">
									{#each item?.orders_items_shipments as oi, idx}
										{@const shipment = oi?.shipment}
										{@const shipmentIdx = shipments?.findIndex((s) => s?.id === shipment?.id)}
										<!-- svelte-ignore a11y-no-static-element-interactions -->
										<div
											class="flex w-fill rounded {selectedShipmentIdx === shipmentIdx
												? 'bg-green-500'
												: oi?.quantity && shipmentsQty !== item.quantity
												? 'bg-red-600'
												: 'bg-slate-500'}"
											on:mouseenter={() => (selectedShipmentIdx = shipmentIdx)}
											on:mouseleave={() => (selectedShipmentIdx = undefined)}
										>
											{#if shipments?.length > 1}
												<p class="text-xs text-white my-auto text-center font-semibold p-1 cursor-default min-w-4">
													{shipmentIdx + 1}
												</p>
											{/if}
											<!-- TODO: Replace badge so that layout is cleaner -->
											<Badge color={shipment?.confirmed_delivery_date ? 'green' : 'blue'}>
												<!-- <TrackingStatus tracking={shipment?.tracking} width={20} height={20} /> -->
												SHP{padString(String(shipment?.id || ''), 4)}
											</Badge>
											<!-- {#if oi?.quantity} -->
											<p
												class="text-xs my-auto text-center font-semibold p-1 cursor-default min-w-8 {selectedShipmentIdx ===
													shipmentIdx &&
												oi?.quantity &&
												shipmentsQty !== item.quantity
													? 'outline outline-red-600'
													: 'text-white'}"
											>
												{oi?.quantity || item.quantity}
											</p>
											<!-- {/if} -->
										</div>
									{:else}
										<div class="flex">
											<Badge color="dark">
												<p class="font-semibold uppercase text-xs">No shipment</p>
											</Badge>
										</div>
									{/each}
								</div>
								{#if editable && $page?.data?.user?.permissions?.['tester']}
									<button
										class="p-1 text-slate-600 hover:text-slate-400"
										on:click={() => {
											editLine = item;
											editShipmentAllocationsModal = true;
										}}
									>
										<EditOutline />
									</button>
								{/if}
							</div>
						</TableBodyCell>
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
							<ReceivingStatus order={item} receiveds={item?.orders_items_receiveds} />
						</TableBodyCell>
						{#if showRecieved}
							{@const remaining = item?.quantity - recievedQty}

							<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
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
						<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
							{#if editable}
								<div class="flex my-auto">
									<Button
										disabled={item?.user?.id !== $page?.data?.user?.id && order?.user?.id !== $page?.data?.user?.id}
										on:click={() => {
											orderLineDeleteModal = true;
											orderLineDelete = item;
										}}
									>
										❌
									</Button>
									<Button
										on:click={() => {
											editLineModal = true;
											editLine = item;
										}}
									>
										<EditOutline class="text-slate-600 hover:text-slate-400" />
									</Button>
								</div>
							{/if}
						</TableBodyCell>
						<slot name="body" />
					</TableBodyRow>
				{:else}
					<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium" colspan="5"
						>No items allocated to this order</TableBodyCell
					>
				{/each}
			</TableBody>
			<TableHead>
				<TableBodyCell padding="px-2 py-1" />
				<TableBodyCell padding="px-2 py-1" />
				<TableBodyCell padding="px-2 py-1" />
				<TableBodyCell padding="px-2 py-1" />
				<TableBodyCell padding="px-2 py-1">
					<Badge color="blue">{totalOrdered}</Badge>
				</TableBodyCell>
				<TableBodyCell padding="px-2 py-1" />
				<TableBodyCell padding="px-2 py-1" />
				<TableBodyCell padding="px-2 py-1">
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: 'GBP'
					}).format(orderItems?.reduce((a, v) => a + v.price * v.quantity, 0))}
				</TableBodyCell>
				<TableBodyCell padding="px-2 py-1">
					<!-- 					<TrackingStatus isDelivered={trackings.filter((t) => t?.statusCode === 'DE').length === orderItems.length} />
 -->
				</TableBodyCell>
				<TableBodyCell padding="px-2 py-1">
					<ReceivingStatus isReceived={totalRecieved === totalOrdered} />
				</TableBodyCell>
				{#if showRecieved}
					<TableBodyCell padding="px-2 py-1">
						<Badge class="mx-0.5" color={!totalRecieved ? 'red' : totalOrdered === totalRecieved ? 'green' : 'yellow'}>
							{totalRecieved}
						</Badge>
					</TableBodyCell>
				{/if}
				<TableBodyCell padding="px-2 py-1">
					{#if editable}
						<Button
							size="sm"
							on:click={() => {
								addLineModal = true;
							}}
						>
							<Plus size="24" class="hover:text-green-600 text-gray-500 cursor-pointer" />
						</Button>
					{/if}
				</TableBodyCell>
				<slot name="foot" />
			</TableHead>
		</Table>
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
	<div class="flex gap-x-1">
		<Spinner color="blue" />
		<p class="animate-pulse">Loading...</p>
	</div>
{/if}
