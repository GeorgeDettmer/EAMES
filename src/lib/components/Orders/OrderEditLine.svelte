<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import {
		Badge,
		Button,
		Label,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { EditOutline, PlusOutline } from 'flowbite-svelte-icons';
	import { messagesStore } from 'svelte-legos';
	import OrderSetTracking from './OrderSetTracking.svelte';
	import { deepEqual, padString } from '$lib/utils';
	import type { OrderItemShipments, Shipment } from '$lib/types';
	import OrderShipment from './OrderShipment.svelte';

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

	export let adding = false;

	let originalPart = part;
	let originalSPN = spn;
	let originalQuantity = quantity;
	let originalPrice = price;
	let originalCategory = category;
	let originalTracking: Tracking[] = structuredClone(tracking);
	let originalItemShipments: OrderItemShipments[] = structuredClone(itemShipments);

	const urqlClient = getContextClient();

	async function save() {
		adding = false;
		if (adding) return;
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

		adding = true;
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
		adding = false;
	}

	$: trackingChange =
		originalTracking.length !== tracking.length ||
		!tracking?.map((t, i) => deepEqual(t, originalTracking?.[i])).every((v) => v);
	$: console.log(
		'trackingChange',
		trackingChange,
		tracking.map((t, i) => [t, originalTracking?.[i], deepEqual(t, originalTracking?.[i])])
	);
	$: console.log('originalTracking', originalTracking);

	$: unallocatedToShipmentQuantity = quantity - itemShipments?.reduce((a, b) => a + b.quantity, 0);
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

	<div class="col-span-4">
		<Label for="small-input"
			>Shipment(s)
			<button
				class="hover:text-green-600"
				on:click={() => {
					tracking = [...tracking, { tracking_number: '', carrier_code: undefined }];
				}}><PlusOutline size="xs" /></button
			>
			{#if unallocatedToShipmentQuantity > 0}
				<span class="text-red-600">{unallocatedToShipmentQuantity} unallocated to shipment</span>
			{/if}
		</Label>
		<div class="">
			<div>
				{#each itemShipments as ois, idx (ois.id)}
					<div class="flex gap-x-1">
						<input
							class="block w-1/3 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
							type="text"
							autocomplete="off"
							placeholder={String(unallocatedToShipmentQuantity)}
							bind:value={ois.quantity}
						/>
						{ois.shipment.id}
						<select
							class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
							bind:value={ois.shipment}
						>
							{#each shipments as shipment, idx}
								<option value={shipment}>
									{!shipment?.id ? '' : shipment.id} ({shipment?.carrier?.name})
								</option>
							{/each}
						</select>

						<OrderShipment shipment={ois.shipment} showDetailsModal={false} popover={false} />
						<!-- <div
							class="w-auto p-0.5 rounded font-medium inline-flex items-center justify-center {ois.shipment
								?.orders_items_shipments?.length
								? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 '
								: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 '}"
						>
							<div class="flex gap-x-4">
								<p class="font-bold">{ois.shipment?.carrier?.name}</p>
								<p>SHP{padString(String(ois.shipment?.id || ''), 4)}</p>
							</div>
						</div> -->
						<!--
						<input
							class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
							type="text"
							autocomplete="off"
							placeholder="Tracking number"
							bind:value={shipment.tracking_number}
						/>
						<button
							class="hover:text-green-600"
							class:text-orange-500={!shipment.tracking_number || !shipment.carrier_code}
							class:invisible={!carrier_urls?.[shipment.carrier_code]}
							on:click={() => {
								if (!shipment.tracking_number || !shipment.carrier_code) return;
								let url = carrier_urls?.[shipment.carrier_code]?.(shipment.tracking_number);
								if (!url) return;
								shipment.tracking_url = url;
							}}
						>
							<ArrowRight size="24" />
						</button>
						<input
							class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
							type="text"
							autocomplete="off"
							placeholder="Tracking url"
							bind:value={shipment.tracking_url}
							on:dblclick={() => {
								if (!shipment?.tracking_url) return;
								window.open(shipment.tracking_url, '_blank');
							}}
						/>
						<button
							class="hover:text-red-600"
							on:click={() => {
								tracking = tracking.filter((v, i) => i !== idx);
							}}
						>
							<XMark />
						</button> -->
					</div>
				{:else}
					<slot />
				{/each}
			</div>
		</div>
	</div>
</div>

<div class="flex pt-6">
	<div class="mx-auto">
		<Table>
			<TableHead>
				<TableHeadCell>Part</TableHeadCell>
				<TableHeadCell>Order Qty</TableHeadCell>
				<TableHeadCell>Unit Cost</TableHeadCell>
				<TableHeadCell>Total Cost</TableHeadCell>
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
				</TableBodyRow>
			</TableBody>
		</Table>
	</div>
</div>

<div class="flex">
	<div class="my-auto mx-auto pt-4">
		<Button
			color="green"
			on:click={() => save()}
			disabled={quantity <= 0 ||
				price < 0 ||
				!part ||
				adding ||
				(originalPart === part &&
					originalSPN === spn &&
					originalQuantity === quantity &&
					originalPrice === price &&
					originalCategory === category &&
					!trackingChange)}
		>
			Update <EditOutline size="md" />
		</Button>
	</div>
</div>
