<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
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
		Modal
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';

	import TrackingStatus from './TrackingStatus.svelte';
	import { green } from 'tailwindcss/colors';
	import ReceivingStatus from './ReceivingStatus.svelte';
	import ReceiveQuantity from './ReceiveQuantity.svelte';
	import { mediaQuery, messagesStore } from 'svelte-legos';

	export let orderId: number;
	export let showRecieved: boolean = false;

	$: orderStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order($orderId: bigint!) {
				erp_orders_by_pk(id: $orderId) {
					id
					tracking
					received_at
					received_user_id
					userByReceivedUserId {
						id
						username
						first_name
						last_name
						initials
						color
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
	$: order = $orderStore?.data?.erp_orders_by_pk;
	$: orderItems = order?.orders_items;
	$: totalRecieved = orderItems?.reduce(
		(a1, item) => item?.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0) + a1,
		0
	);
	$: totalOrdered = orderItems?.reduce((a, v) => a + v.quantity, 0);

	$: console.log('order:', order);

	let recieveModal = false;
	let orderItemSelected;
	let orderItemSelectedQty = 0;
</script>

<Modal autoclose bind:open={recieveModal}>
	<div>
		<ReceiveQuantity orderItemId={orderItemSelected?.id} quantity={orderItemSelectedQty} />

		{#if orderItemSelected?.orders_items_receiveds}
			<div class="mt-6">
				<Table>
					<TableHead>
						<TableHeadCell>User</TableHeadCell>
						<TableHeadCell>Time/Date</TableHeadCell>
						<TableHeadCell>Quantity</TableHeadCell>
					</TableHead>

					{#each orderItemSelected?.orders_items_receiveds as received}
						<TableBodyRow>
							<TableBodyCell tdClass=" font-sm ">
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
							<TableBodyCell tdClass=" font-sm ">
								{datetimeFormat(received.updated_at)}
							</TableBodyCell>
							<TableBodyCell tdClass=" font-sm ">
								{received?.quantity}
							</TableBodyCell>
						</TableBodyRow>
					{:else}
						<TableBodyCell colspan="3">No receipts for this order item</TableBodyCell>
					{/each}
				</Table>
			</div>
		{/if}
	</div>
</Modal>

{#if order}
	<div class="flex">
		<div><OrdersListItem {order} interactive={false} /></div>
		<div class="pt-2 pl-2">
			<UserIcon size="sm" user={order?.user}>
				{order?.user?.first_name}
				{order?.user?.last_name}
			</UserIcon>
		</div>
	</div>
	<Table>
		<TableHead>
			<TableHeadCell>User</TableHeadCell>
			<TableHeadCell>Time/Date</TableHeadCell>
			<!-- 			<TableHeadCell>Reference</TableHeadCell> -->
			<TableHeadCell>Part</TableHeadCell>
			<TableHeadCell>Order Qty</TableHeadCell>
			<TableHeadCell>Cost</TableHeadCell>
			<TableHeadCell />
			<TableHeadCell />
			{#if showRecieved}
				<TableHeadCell>Recieved Qty</TableHeadCell>
			{/if}
			<slot name="head" />
		</TableHead>
		<TableBody>
			{#each orderItems as item, idx}
				<TableBodyRow class="p-0 object-right">
					<TableBodyCell tdClass="px-1 py-0 whitespace-nowrap font-sm ">
						<UserIcon size="xs" user={item?.user}>
							{item?.user?.first_name}
							{item?.user?.last_name}
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
						}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
					</TableBodyCell>
					<TableBodyCell>
						<TrackingStatus tracking={item?.tracking || order?.tracking} />
					</TableBodyCell>
					<TableBodyCell>
						<ReceivingStatus
							order={item}
							receiveds={item?.orders_items_receiveds}
							isReceived={item?.quantity === item?.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0)}
						/>
					</TableBodyCell>
					{#if showRecieved}
						{@const recievedQty = item?.orders_items_receiveds?.reduce((a, v) => a + v.quantity, 0)}
						{@const remaining = item?.quantity - recievedQty}

						<TableBodyCell>
							<Badge
								class="mx-0.5"
								color={item?.quantity === 0 ? 'red' : item?.quantity === recievedQty ? 'green' : 'yellow'}
							>
								{recievedQty}
							</Badge>
							<!-- <Badge
								class="mx-0.5"
								color={item?.quantity === 0 ? 'red' : item?.quantity === recievedQty ? 'green' : 'yellow'}
							>
								<span class="mr-1">➖</span>{recievedQty}<span class="ml-1">➕</span>
							</Badge> -->
							<span
								class="cursor-not-allowed"
								class:cursor-pointer={remaining}
								on:click={() => {
									/* if (!remaining) {
										messagesStore('No more of this item remaining to receive', 'warning');
										return;
									} */
									recieveModal = true;
									orderItemSelectedQty = remaining;
									orderItemSelected = item;
								}}
							>
								➕
							</span>
						</TableBodyCell>
					{/if}
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
			<!-- 			<TableBodyCell /> -->
			<TableBodyCell>
				<Badge class="mx-0.5" color="blue">{totalOrdered}</Badge>
			</TableBodyCell>
			<TableBodyCell>
				{new Intl.NumberFormat('en-GB', {
					style: 'currency',
					currency: 'GBP'
				}).format(orderItems?.reduce((a, v) => a + v.price * v.quantity, 0))}
			</TableBodyCell>
			<TableBodyCell />
			<TableBodyCell />
			{#if showRecieved}
				<TableBodyCell>
					<Badge class="mx-0.5" color={totalRecieved === totalOrdered ? 'green' : 'yellow'}>
						{totalRecieved}
					</Badge>
				</TableBodyCell>
			{/if}
			<slot name="foot" />
		</TableHead>
	</Table>
{:else}
	<p>No order info</p>
{/if}
