<script lang="ts">
	import type { OrderItemShipments, Shipment } from '$lib/types';
	import { padString } from '$lib/utils';
	import { XMark } from 'svelte-heros-v2';
	import OrderShipment from '../Orders/OrderShipment.svelte';
	import { enhance } from '$app/forms';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import { Spinner, Tooltip } from 'flowbite-svelte';
	import { getContextClient, gql, queryStore } from '@urql/svelte';

	export let orderItem;
	export let allocations: OrderItemShipments[];
	export let shipments: Shipment[];
	export let selectedAllocation: OrderItemShipments = allocations?.[0] || {};

	let allShipmentsStore = queryStore({
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
		variables: { _nin: shipments?.map((s) => s.id) },
		requestPolicy: 'cache-and-network'
	});
	$: allShipments = $allShipmentsStore?.data?.erp_shipments || [];

	let allowAdd = true;
	let showAdd = false;
	let selectedShipmentAdd: Shipment = {
		id: undefined
	};

	$: console.log('ssssssssss', shipments);

	$: allocationsShipmentIds = allocations.map((a) => a.shipment.id);
	$: unallocatedShipments = shipments.filter((s) => !allocationsShipmentIds.includes(s.id));
	$: console.log('allocationsShipmentIds', allocationsShipmentIds, 'unallocatedShipments', unallocatedShipments);
	$: unallocatedQuantity =
		(orderItem?.quantity || 0) - allocations?.reduce((a, b) => a + (b?.quantity || orderItem.quantity), 0);

	let addQuantity;
</script>

<div class="">
	{#if unallocatedQuantity > 0}
		<p class="text-red-600 font-bold">{unallocatedQuantity} not allocated to any shipment!</p>
	{/if}
	<div class="p-1">
		<!-- Form to submit shipment allocation edits -->
		{#if allocations.length > 0}
			<form
				class="inline-flex gap-x-2"
				method="POST"
				action="/order?/updateShipmentAllocation"
				use:enhance
				on:submit|preventDefault={(e) => console.warn(e)}
			>
				<input type="hidden" name="id" bind:value={selectedAllocation.id} />
				<input type="hidden" name="order_item_id" bind:value={orderItem.id} />
				<input type="hidden" name="shipment_id" bind:value={selectedAllocation.shipment.id} />
				<select
					name="allocation"
					bind:value={selectedAllocation}
					class="block w-48 text-md disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
				>
					{#each allocations as allocation, idx}
						<option value={allocation}>
							SHP{padString(String(allocation?.shipment?.id || ''), 4)} ({allocation?.id})
						</option>
					{/each}
				</select>
				<input
					name="quantity"
					class="block w-24 text-md disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					type="number"
					min="1"
					max={selectedAllocation.quantity + unallocatedQuantity}
					placeholder={orderItem.quantity}
					bind:value={selectedAllocation.quantity}
				/>
				<OrderShipment shipment={selectedAllocation?.shipment} showDetailsModal={false} popover={false} />
				<button
					class="ml-auto my-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
					disabled={allocations.length < 2}
					formaction="/order?/deleteShipmentAllocation"
					formnovalidate
					on:click={() => {
						/* itemShipments = itemShipments.filter((v, i) => i !== idx);
		selectedShipment = {}; */
					}}
				>
					<XMark size="30" />
				</button>
				<button
					class="ml-auto my-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
					on:click={() => {
						/* itemShipments = itemShipments.filter((v, i) => i?.shipment?.id !== selectedOis?.shipment?.id); */
					}}
				>
					<img
						style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
						width="24"
						height="24"
						src="https://img.icons8.com/ios/50/save--v1.png"
						alt="save"
					/>
				</button>
			</form>
		{:else}
			<p class="text-red-600 font-bold">No shipment allocations!</p>
		{/if}
	</div>
	<div class="">
		{#if allowAdd}
			{#if showAdd}
				<!-- Form to submit new shipment allocation -->
				<form
					class="inline-flex gap-x-2 bg-green-600 p-1 rounded bg-opacity-75"
					method="POST"
					action="/order?/createShipmentAllocation"
					use:enhance
					on:submit|preventDefault={(e) => {
						console.warn('createShipmentAllocation', e);
						showAdd = false;
					}}
				>
					<input type="hidden" name="order_item_id" value={orderItem.id} />
					<input type="hidden" name="shipment_id" bind:value={selectedShipmentAdd.id} />
					{#if $allShipmentsStore.fetching}
						<Spinner size="3" color="white" />
					{/if}
					<select
						name="shipment"
						bind:value={selectedShipmentAdd}
						on:change={(e) => {
							console.log('selectedShipmentAdd', selectedShipmentAdd);
						}}
						class="block h-12 w-48 text-md disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					>
						{#each unallocatedShipments as shipment}
							<option value={shipment}>
								SHP{padString(String(shipment.id || ''), 4)} ({shipment?.carrier?.id})*
							</option>
						{/each}
						{#if unallocatedShipments.length !== 0}
							<option> -------------------- </option>
						{/if}

						{#each allShipments as shipment}
							<option value={shipment}>
								SHP{padString(String(shipment.id || ''), 4)} ({shipment?.carrier?.id})
							</option>
						{/each}
					</select>
					<input
						bind:value={addQuantity}
						name="quantity"
						class="block w-24 text-md disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
						type="number"
						min="1"
						max={unallocatedQuantity}
					/>
					{#if selectedShipmentAdd?.id}
						<OrderShipment shipmentId={selectedShipmentAdd.id} showDetailsModal showItems popover={false} />
					{/if}

					<button
						class="ml-auto my-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
						on:click={(e) => {
							//e.target?.reset();
						}}
					>
						<XMark size="30" />
					</button>
					<button
						class="ml-auto my-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
						on:click={() => {
							//allocations = [...allocations, { shipment: { ...selectedShipmentAdd }, quantity: addQuantity }];
						}}
					>
						<img
							style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
							width="24"
							height="24"
							src="https://img.icons8.com/ios/50/save--v1.png"
							alt="save"
						/>
					</button>
				</form>
			{:else}
				<button
					class="w-full bg-green-600 p-1 rounded bg-opacity-25 hover:bg-opacity-75 disabled:bg-gray-700 disabled:cursor-not-allowed"
					disabled={unallocatedQuantity < 1}
					on:click={() => (showAdd = true)}
				>
					<PlusOutline class="mx-auto" size="md" />
				</button>
			{/if}
		{/if}
	</div>
</div>
