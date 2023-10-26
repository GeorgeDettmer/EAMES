<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Tooltip } from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';
	import { stringToArray } from 'konva/lib/shapes/Text';
	import { stringify } from 'postcss';
	import { onMount } from 'svelte';

	export let orderId: number;

	$: orderStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order($orderId: bigint!) {
				erp_orders_by_pk(id: $orderId) {
					id
					tracking
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

	$: console.log('order:', order);

	async function track(tracking: string, carrier: string) {
		const response = await fetch(`/api/shipengine/track?tracking_number=${tracking}&carrier_code=${carrier}`);
		const result = await response.json();
		if (result?.statusCode) {
			console.log('tracking request success', result);
			return result;
		} else {
			console.log('tracking request fail', response);
		}
	}

	$: {
		if (orderItems) {
			orderItems?.forEach((item, idx) => {
				const trackingNumber = item?.tracking?.tracking_number;
				const carrier = item?.tracking?.carrier_code;
				if (trackingNumber && carrier) {
					track(trackingNumber, carrier).then((t) => (item.tracking._result = t));
				}
			});
		}
	}

	let tracking = true;
	$: {
		if (order?.tracking?.tracking_number && order?.tracking?.carrier_code) {
			track(order?.tracking?.tracking_number, order?.tracking?.carrier_code).then((t) => (tracking = t));
		}
	}
</script>

{#if order}
	<div class="flex">
		<div><OrdersListItem {order} interactive={false} /></div>
		<div class="pt-2 pl-2">
			<UserIcon size="sm" user={order?.user}>
				{order?.user?.first_name}
				{order?.user?.last_name}
			</UserIcon>
		</div>
		<div class="align-middle float-right mx-auto">
			<a target="_blank" href={order?.tracking?.tracking_url}>
				{#if tracking?.statusCode === 'DE'}
					<img
						style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
						width="32"
						height="32"
						src="https://img.icons8.com/windows/32/delivered-box.png"
						alt="delivered-box"
					/>
				{:else if tracking?.statusCode === 'EX'}
					<img
						style="filter: brightness(0) saturate(100%) invert(90%) sepia(97%) saturate(925%) hue-rotate(360deg)"
						width="32"
						height="32"
						src="https://img.icons8.com/windows/32/package--v2.png"
						alt="package--v2"
					/>
				{:else if tracking?.statusCode === 'IT'}
					<img
						style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(800%) hue-rotate(150deg)"
						width="30"
						height="30"
						src="https://img.icons8.com/ios-glyphs/30/delivery--v1.png"
						alt="delivery--v1"
					/>
				{:else}
					<img width="32" height="32" src="https://img.icons8.com/windows/32/box-other.png" alt="box-other" />
				{/if}
				<p class="font-semibold">{tracking?.statusDescription || ''}</p>
			</a>
		</div>
	</div>
	<Table>
		<TableHead>
			<TableHeadCell>User</TableHeadCell>
			<TableHeadCell>Time/Date</TableHeadCell>
			<!-- 			<TableHeadCell>Reference</TableHeadCell> -->
			<TableHeadCell>Part</TableHeadCell>
			<TableHeadCell>Qty</TableHeadCell>
			<TableHeadCell>Cost</TableHeadCell>
			<TableHeadCell />
		</TableHead>
		<TableBody>
			{#each orderItems as item, idx}
				{@const itemTracking = item?.tracking?._result || tracking}
				<TableBodyRow class="p-0 object-right">
					<TableBodyCell tdClass="px-0 py-0 whitespace-nowrap font-sm ">
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
						{item?.quantity}
					</TableBodyCell>

					<TableBodyCell>
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
					</TableBodyCell>
					<TableBodyCell>
						<a target="_blank" href={item?.tracking?.tracking_url || order?.tracking?.tracking_url}>
							{#if itemTracking?.statusCode === 'DE'}
								<img
									style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/windows/32/delivered-box.png"
									alt="delivered-box"
								/>
							{:else if itemTracking?.statusCode === 'EX'}
								<img
									style="filter: brightness(0) saturate(100%) invert(90%) sepia(97%) saturate(925%) hue-rotate(360deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/windows/32/package--v2.png"
									alt="package--v2"
								/>
							{:else if itemTracking?.statusCode === 'IT'}
								<img
									style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(800%) hue-rotate(150deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/ios-glyphs/30/delivery--v1.png"
									alt="delivery--v1"
								/>
							{:else}
								<img width="24" height="24" src="https://img.icons8.com/windows/32/box-other.png" alt="box-other" />
							{/if}
						</a>
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
			<!-- 			<TableBodyCell /> -->
			<TableBodyCell>
				{orderItems?.reduce((a, v) => a + v.quantity, 0)}
			</TableBodyCell>
			<TableBodyCell>
				{new Intl.NumberFormat('en-GB', {
					style: 'currency',
					currency: 'GBP'
				}).format(orderItems?.reduce((a, v) => a + v.price * v.quantity, 0))}
			</TableBodyCell>
			<TableBodyCell />
		</TableHead>
	</Table>
{/if}
