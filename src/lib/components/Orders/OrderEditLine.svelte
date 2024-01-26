<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import {
		Badge,
		Button,
		Label,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import { EditOutline, PlusOutline } from 'flowbite-svelte-icons';
	import { messagesStore } from 'svelte-legos';
	import { deepEqual, padString } from '$lib/utils';
	import type { OrderItemShipments, Shipment } from '$lib/types';
	import OrderShipment from './OrderShipment.svelte';
	import { XMark } from 'svelte-heros-v2';
	import { enhance } from '$app/forms';
	import TrackingStatus from './TrackingStatus.svelte';
	import ShipmentAllocationsEdit from '../Shipment/ShipmentAllocationsEdit.svelte';

	interface Category {
		id: string | null;
		text?: string;
	}
	interface Tracking {
		carrier_code?: string;
		tracking_number?: string;
		tracking_url?: string;
	}

	export let line;
	export let part: string = line?.part || '';
	export let spn: string = line?.spn || '';
	export let quantity: number = line?.quantity || 0;
	export let price: number = line?.price || 0;
	export let tracking: Tracking[] = line?.tracking || [];
	export let category: string = line?.category || 'Component';
	export let categories: Category[] = [
		{ id: null, text: 'Unknown' },
		{ id: 'Component' },
		{ id: 'Tooling' },
		{ id: 'PCB' },
		{ id: 'Consumables' },
		{ id: 'Other' }
	];
	export let shipments: Shipment[] = [];
	export let itemShipments: OrderItemShipments[] = line?.orders_items_shipments || [];

	export let updating = false;

	let originalPart = part;
	let originalSPN = spn;
	let originalQuantity = quantity;
	let originalPrice = price;
	let originalCategory = category;
	let originalTracking: Tracking[] = structuredClone(tracking);
	let originalItemShipments: OrderItemShipments[] = structuredClone(itemShipments);

	const urqlClient = getContextClient();

	async function update() {
		if (updating) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!$page?.data?.user?.processes?.purchase) {
			messagesStore('You do not have purchase permission', 'warning');
			return;
		}
		if (quantity <= 0 || price < 0 || !part) {
			messagesStore('Validation error, check you input. (quantity <= 0 || price < 0 || !part)', 'warning');
			return;
		}

		updating = true;
		let mutationResult;
		mutationResult = await urqlClient.mutation(
			gql`
				mutation updateOrderItem($_set: erp_orders_items_set_input!, $id: uuid!) {
					update_erp_orders_items_by_pk(pk_columns: { id: $id }, _set: $_set) {
						id
					}
				}
			`,
			{ id: line?.id, _set: { category, part, spn, price, quantity } }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Updated: ' + mutationResult.data.update_erp_orders_items_by_pk.id, 'success');
			line.tracking = tracking;
			part = '';
			spn = '';
			category = 'Component';
			price = 0;
			quantity = 0;
			tracking = [];
		}
		updating = false;
	}

	$: carriersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query carriers {
				erp_carriers(order_by: { shipments_aggregate: { count: desc_nulls_last } }) {
					id
					name
					image_url
				}
			}
		`
	});
	$: carriers = $carriersStore?.data?.erp_carriers;

	$: shipmentsChange =
		originalItemShipments.length !== itemShipments.length ||
		!itemShipments?.map((t, i) => deepEqual(t, originalItemShipments?.[i])).every((v) => v);
	$: console.log(
		'shipmentsChange',
		shipmentsChange,
		itemShipments.map((t, i) => [t, originalItemShipments?.[i], deepEqual(t, originalItemShipments?.[i])])
	);
	$: console.log('originalTracking', originalTracking);

	/* 	$: unallocatedToShipmentQuantity = quantity - itemShipments?.reduce((a, b) => a + (b?.quantity || line.quantity), 0);
	$: unallocatedToShipments = shipments.filter((s) => !itemShipments?.some((is) => is?.shipment?.id === s?.id));
	$: console.log('unallocatedToShipments', unallocatedToShipments);
	$: console.log('selectedOis', selectedOis);
 */
	let selectedOis = itemShipments?.[0] || {
		quantity: undefined
	};
	let selectedShipment = {
		id: undefined
	};

	$: shipmentsQty = line?.orders_items_shipments?.reduce((a, v) => a + v.quantity, 0);
</script>

<div class="grid grid-cols-4 gap-2">
	<div class="col-span-2">
		<Label for="small-input">Part/Item</Label>
		<input
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			type="text"
			autocomplete="off"
			bind:value={part}
		/>
	</div>
	<div class="col-span-2">
		<Label for="small-input">Supplier PN</Label>
		<input
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			type="text"
			autocomplete="off"
			bind:value={spn}
		/>
	</div>
	<div class="col-span-2">
		<Label for="small-input">Quantity</Label>
		<input
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			type="number"
			autocomplete="off"
			min="0"
			bind:value={quantity}
		/>
	</div>
	<div class="col-span-2">
		<Label for="small-input">Unit Price</Label>
		<input
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			type="number"
			autocomplete="off"
			min="0"
			bind:value={price}
		/>
	</div>

	<div class="col-span-2">
		<Label for="small-input">Category</Label>
		<select
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			bind:value={category}
		>
			{#each categories as { id, text }}
				<option value={id}>
					{text || id}
				</option>
			{/each}
		</select>
	</div>
</div>
<div class="flex pt-6">
	<div class="mx-auto">
		<Table>
			<TableHead>
				<TableHeadCell>Part</TableHeadCell>
				<TableHeadCell>Order Qty</TableHeadCell>
				<TableHeadCell>Unit Price</TableHeadCell>
				<TableHeadCell>Total Price</TableHeadCell>
				<TableHeadCell>Shipments</TableHeadCell>
			</TableHead>
			<TableBody>
				<TableBodyRow class="p-0 object-right">
					<TableBodyCell>
						<div>
							<p>{part}</p>
							{#if spn}
								<p class="text-xs italic">{spn}</p>
							{/if}
						</div>
					</TableBodyCell>
					<TableBodyCell>
						<Badge class="mx-0.5" color={'blue'}>
							{quantity}
						</Badge>
					</TableBodyCell>
					<TableBodyCell>
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(price)}
					</TableBodyCell>
					<TableBodyCell>
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(Math.round((price * quantity + Number.EPSILON) * 100) / 100 || 0)}
					</TableBodyCell>
					<TableBodyCell>
						<div class="space-y-1">
							{#each line?.orders_items_shipments as oi, idx}
								{@const shipment = oi?.shipment}
								{@const shipmentIdx = shipments?.findIndex((s) => s?.id === shipment?.id)}
								<div class="flex w-fit rounded bg-slate-500">
									{#if shipments?.length > 1}
										<p class="text-xs text-white my-auto text-center font-semibold p-1 cursor-default">
											{shipmentIdx + 1}
										</p>
									{/if}
									<!-- TODO: Replace badge so that layout is cleaner -->
									<Badge color={shipment?.confirmed_delivery_date ? 'green' : 'blue'}>
										<!-- <TrackingStatus tracking={shipment?.tracking} width={20} height={20} /> -->
										SHP{padString(String(shipment?.id || ''), 4)}
									</Badge>
									<!-- {#if oi?.quantity} -->
									<div
										class="rounded p-1 my-auto h-fit {oi?.quantity && shipmentsQty !== quantity
											? 'bg-red-600 font-bold'
											: ' font-semibold'}"
									>
										<p class="text-xs text-white text-center cursor-default">
											{oi?.quantity || quantity}
										</p>
									</div>
									<!-- {/if} -->
								</div>
							{:else}
								<div class="flex">
									<img
										style="filter: brightness(0) saturate(100%) invert(90%) sepia(97%) saturate(925%) hue-rotate(360deg)"
										width="24"
										height="24"
										src="https://img.icons8.com/ios/50/cardboard-box.png"
										alt="box-other"
									/>
									<p class="font-semibold pt-1 pl-1 uppercase text-xs">No shipment</p>
								</div>
							{/each}
						</div>
					</TableBodyCell>
				</TableBodyRow>
			</TableBody>
		</Table>
	</div>
</div>

<div class="flex">
	<div class="my-auto mx-auto pt-4">
		<Button
			color="green"
			on:click={() => update()}
			disabled={quantity <= 0 ||
				price < 0 ||
				!part ||
				updating ||
				(originalPart === part &&
					originalSPN === spn &&
					originalQuantity === quantity &&
					originalPrice === price &&
					originalCategory === category &&
					!shipmentsChange)}
		>
			Update <EditOutline size="md" />
		</Button>
	</div>
</div>
