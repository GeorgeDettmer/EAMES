<script lang="ts">
	import type { Shipment } from '$lib/types';
	import type { Placement } from '@popperjs/core';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import {
		Badge,
		Label,
		Modal,
		Popover,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import { carrier_urls, classes, datetimeFormat, padString } from '$lib/utils';
	import TrackingStatus from './TrackingStatus.svelte';
	import TrackingTimeline from '../Tracking/TrackingTimeline.svelte';
	import { EditOutline, SearchOutline } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import { XMark } from 'svelte-heros-v2';
	import { onMount } from 'svelte';
	import ShipmentItemsTable from '../Shipment/ShipmentItemsTable.svelte';

	export let shipmentId: number = 0;
	export let shipment: Shipment | undefined = undefined;
	export let showItems: boolean = false;
	export let tooltipPlacement: Placement = 'left';
	export let showDetailsModal: boolean = true;
	export let modalOpen: boolean = false;
	export let popover: boolean = true;
	export let allowEdit: boolean = false;

	let shipmentInfoStore;
	$: if (shipmentId) {
		shipmentInfoStore = queryStore({
			client: getContextClient(),
			query: gql`
				query supplierInfo($shipmentId: bigint!) {
					erp_shipments_by_pk(id: $shipmentId) {
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
			variables: { shipmentId },
			requestPolicy: 'cache-and-network'
		});
	}

	$: shipmentInfo = shipmentId ? $shipmentInfoStore?.data?.erp_shipments_by_pk : shipment;

	let carriersStore;
	$: if (allowEdit) {
		carriersStore = queryStore({
			client: getContextClient(),
			query: gql`
				query carriers {
					erp_carriers(order_by: { shipments_aggregate: { count: desc_nulls_last } }) {
						id
						name
						image_url
						suppliers {
							id
							name
						}
					}
				}
			`
		});
	}
	$: carriers = $carriersStore?.data?.erp_carriers;
	//$: console.log('shipmentInfo', shipmentInfo);
	let showTrackingStatus = false;
	function getTrackingUrl(carrier: string, tracking: string): string {
		if (!carrier || !tracking) return '';
		let url = carrier_urls?.[carrier]?.(tracking);
		if (!url) return '';
		return url;
	}

	$: _classes = `cursor-pointer h-12 w-auto px-2 rounded font-medium inline-flex items-center justify-center ${
		shipmentInfo?.confirmed_delivery_date
			? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 '
			: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 '
	}`;

	let showEditForm = false;
</script>

{#if $shipmentInfoStore?.fetching}
	<div class="flex gap-x-2">
		<div>
			<Spinner size="6" color="gray" />
		</div>
		<div class="my-auto animate-pulse w-24">
			<div class="h-3 bg-gray-200 rounded-full dark:bg-gray-700" />
			<span class="sr-only">Loading...</span>
		</div>
	</div>
{:else if $shipmentInfoStore?.error}
	<h1 class="text-red-600">Shipment query error</h1>
	<p class="text-red-600">{$shipmentInfoStore.error.message}</p>
{:else if shipmentInfo}
	<div on:click={() => (modalOpen = true)} class={$$props?.class ? $$props?.class : _classes}>
		<div class="flex gap-x-4 overflow-hidden">
			<div class="flex-col">
				<p class="font-bold">{shipmentInfo?.carrier?.name ? shipmentInfo?.carrier?.name : 'N/A'}</p>
				<div class="flex">
					<!-- TODO: Use different icons, tracking should be 'van', box with tick should be our confirmation of delivery -->
					{#if shipmentInfo?.tracking}
						<TrackingStatus tracking={shipmentInfo?.tracking} showText={false} showPopover={false} width={20} height={20} />
					{/if}
					<img
						style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(900%) hue-rotate(70deg)"
						width="20"
						height="20"
						src="https://img.icons8.com/windows/32/delivered-box.png"
						alt="delivered-box"
						class:invisible={!shipmentInfo?.confirmed_delivery_date}
					/>
				</div>
			</div>
			<div class="flex-col">
				<div class="justify-end text-right">
					<p>SHP{padString(String(shipmentInfo?.id || ''), 4)}</p>
				</div>
				{#if shipmentInfo?.confirmed_delivery_date || shipmentInfo?.expected_delivery_date}
					<p class="float-right text-sm">
						{new Date(shipmentInfo?.confirmed_delivery_date || shipmentInfo?.expected_delivery_date).toLocaleDateString(
							'en-GB',
							{
								day: '2-digit',
								month: '2-digit',
								year: '2-digit'
							}
						)}
					</p>
				{/if}
			</div>
		</div>
		<slot />
	</div>
	<!-- <div on:click={() => (modalOpen = !modalOpen)} class:cursor-pointer={showDetails}>
		<img src="https://img.icons8.com/ios/50/cardboard-box.png" alt="cardboard-box" />
	</div> -->
	{#if popover}
		<Popover placement={tooltipPlacement}>
			<div class="flex gap-x-2">
				<div class="my-auto rounded-lg">
					<a href={shipmentInfo?.url} target="_blank">
						{#if shipmentInfo?.carrier?.image_url}
							<img
								class="h-8 p-0.5 rounded-lg bg-gray-200"
								class:hidden={!shipmentInfo?.carrier?.image_url}
								src={shipmentInfo?.carrier?.image_url}
								alt={shipmentInfo?.carrier?.name}
							/>
						{:else}
							<p class="text-xl font-bold text-center w-8 p-0.5 rounded-lg bg-gray-200">
								{(shipmentInfo?.carrier?.name || 'Unknown')
									?.split(' ')
									?.map((s) => s?.[0]?.toUpperCase())
									.join('')}
							</p>
						{/if}
					</a>
				</div>
				<div class="my-auto">
					<p class="text-lg font-semibold leading-none text-gray-900 dark:text-white">
						<a href="/supplier/{shipmentInfo?.carrier?.id}" class="hover:underline"
							>{shipmentInfo?.carrier?.name || 'Unknown'}</a
						>
					</p>
					<div class="flex gap-x-1">
						{#if shipmentInfo?.tracking?.tracking_number}
							{#if shipmentInfo?.tracking?.tracking_url}
								<a class="text-xs hover:underline" href={shipmentInfo?.tracking?.tracking_url} target="_blank">
									{shipmentInfo?.tracking?.tracking_number}
								</a>
							{:else}
								<p class="text-xs">
									{shipmentInfo?.tracking?.tracking_number}
								</p>
							{/if}
							{#if shipmentInfo?.tracking?.id}
								<p class="text-xs">({shipmentInfo?.tracking?.id})</p>
							{/if}
						{/if}
					</div>
				</div>
			</div>
			{#if shipmentInfo?.tracking?.events?.[0]}
				{@const event = shipmentInfo?.tracking?.events[0]}
				<div class="flex-wrap max-w-sm">
					<!-- 	{#each shipmentInfo?.tracking?.events as event, i} -->
					<div class="text-xs">
						<p class="break-words">{event?.description}</p>
						<p class="italic text-xs">{datetimeFormat(event?.occurredAt)} {event?.signer ? `(${event?.signer})` : ''}</p>
					</div>
					<!-- {/each} -->
				</div>
			{/if}
		</Popover>
	{/if}
{:else}
	<div class={'text-base font-semibold leading-none text-gray-900 dark:text-white'}>Shipment info unavailable...</div>
{/if}
{#if showDetailsModal}
	<Modal
		outsideclose
		title={`SHP${padString(String(shipmentInfo?.id || ''), 4)}`}
		bind:open={modalOpen}
		size="lg"
		on:close={() => {
			showEditForm = false;
		}}
	>
		<div class="flex gap-x-2">
			{#if showEditForm}
				<form
					class="inline-flex gap-x-2"
					method="POST"
					action="/order?/updateShipment"
					use:enhance
					on:submit|preventDefault={(e) => {
						console.dir('form submit', shipmentInfo);
						showEditForm = false;
					}}
				>
					<input type="hidden" name="shipment_id" bind:value={shipmentInfo.id} />
					<input type="hidden" name="carrier_id" bind:value={shipmentInfo.carrier_id} />
					{#if shipmentInfo?.tracking?.id}
						<input type="hidden" name="tracking_id" bind:value={shipmentInfo.tracking.id} />
					{/if}
					{#if shipmentInfo?.tracking?.carrier_code}
						<input type="hidden" name="carrier_code" bind:value={shipmentInfo.tracking.carrier_code} />
					{/if}

					<div>
						<label class="text-xs" for="carrier">Carrier</label>
						<select
							class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
							name="carrier"
							bind:value={shipmentInfo.carrier}
							on:change={() => {
								if (!shipmentInfo?.tracking) {
									shipmentInfo.tracking = {};
								}
								if (!shipmentInfo?.carrier) {
									shipmentInfo.carrier = {};

									shipmentInfo.tracking.tracking_url = getTrackingUrl(
										shipmentInfo.carrier.id,
										shipmentInfo.tracking.tracking_number
									);
								}
								shipmentInfo.tracking.carrier_code = shipmentInfo?.carrier?.id;
								shipmentInfo.carrier_id = shipmentInfo?.carrier?.id;
								showTrackingStatus = false;
							}}
						>
							<option />
							{#each carriers || [] as carrier, idx}
								<option value={carrier}>
									{carrier?.name}
								</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="text-xs" for="carrier">Expected date</label>
						<input
							class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-1"
							name="expected_delivery_date"
							type="date"
							value={new Date(shipmentInfo?.expected_delivery_date).toLocaleDateString('fr-CA')}
							on:change={({ target }) => {
								shipmentInfo.expected_delivery_date = new Date(target?.value)?.toISOString();
							}}
						/>
					</div>
					<div>
						<label class="text-xs" for="carrier">Tracking number</label>
						<input
							class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-1"
							name="tracking_number"
							type="text"
							value={shipmentInfo?.tracking?.tracking_number || ''}
							on:input={({ target }) => {
								if (!shipmentInfo?.tracking) {
									shipmentInfo.tracking = {};
								}
								shipmentInfo.tracking.tracking_number = target?.value;
								shipmentInfo.tracking.tracking_url = getTrackingUrl(
									shipmentInfo.carrier.id?.toLowerCase(),
									shipmentInfo.tracking.tracking_number
								);
								showTrackingStatus = false;
							}}
						/>
					</div>

					<div class="flex gap-x-2">
						<div>
							<label class="text-xs" for="carrier">Tracking URL</label>
							<input
								class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-1"
								name="tracking_url"
								type="url"
								value={shipmentInfo?.tracking?.tracking_url || ''}
								on:dblclick={({ target }) => {
									shipmentInfo.tracking.tracking_url = target?.value;
									if (!shipmentInfo?.tracking?.tracking_url) return;
									window.open(shipmentInfo.tracking.tracking_url, '_blank');
								}}
							/>
						</div>
						<div class="mt-auto">
							{#if showTrackingStatus}
								<TrackingStatus
									tracking={{
										tracking_number: shipmentInfo?.tracking?.tracking_number,
										tracking_url: shipmentInfo?.tracking?.tracking_number,
										carrier_code: shipmentInfo?.tracking?.carrier_code
									}}
								/>
							{:else}
								{@const disabled =
									!shipmentInfo?.carrier ||
									!shipmentInfo?.tracking?.tracking_number ||
									!shipmentInfo?.tracking?.carrier_code}
								<button
									class="disabled:cursor-not-allowed disabled:opacity-50"
									{disabled}
									on:click={() => (showTrackingStatus = true)}
								>
									<SearchOutline />
									{#if disabled}
										<Tooltip placement="bottom" defaultClass="p-0.5 text-xs">
											Carrier & tracking number must be set to track
										</Tooltip>
									{/if}
								</button>
							{/if}
						</div>
					</div>
					<!-- TODO: Show save only if data changed (not working yet as need to check why modal isnt mounted on opening...) -->
					<!-- {#if changed} -->

					<button
						class="mt-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
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
					<!-- {:else} -->
					<button on:click={() => (showEditForm = false)}>
						<XMark />
					</button>
					<!-- {/if} -->
				</form>
			{:else}
				<div class="my-auto rounded-lg">
					<a href={shipmentInfo?.url} target="_blank">
						{#if shipmentInfo?.carrier?.image_url}
							<img
								class="h-8 p-0.5 rounded-lg bg-gray-200"
								class:hidden={!shipmentInfo?.carrier?.image_url}
								src={shipmentInfo?.carrier?.image_url}
								alt={shipmentInfo?.carrier?.name || 'Unknown'}
							/>
						{:else}
							<p class="text-xl font-bold text-center w-8 p-0.5 rounded-lg bg-gray-200">
								{(shipmentInfo?.carrier?.name || 'Unknown')
									?.split(' ')
									?.map((s) => s?.[0]?.toUpperCase())
									.join('')}
							</p>
						{/if}
					</a>
				</div>
				<div class="my-auto">
					<p class="text-lg font-semibold leading-none text-gray-900 dark:text-white">
						<a href="/supplier/{shipmentInfo?.carrier?.id}" class="hover:underline"
							>{shipmentInfo?.carrier?.name || 'Unknown'}</a
						>
					</p>
					<div class="flex gap-x-1">
						{#if shipmentInfo?.tracking?.tracking_number}
							{#if shipmentInfo?.tracking?.tracking_url}
								<a class="text-xs hover:underline" href={shipmentInfo?.tracking?.tracking_url} target="_blank">
									{shipmentInfo?.tracking?.tracking_number}
								</a>
							{:else}
								<p class="text-xs">
									{shipmentInfo?.tracking?.tracking_number}
								</p>
							{/if}
							{#if shipmentInfo?.tracking?.id}
								<p class="text-xs">({shipmentInfo?.tracking?.id})</p>
							{/if}
						{/if}
					</div>
				</div>
				<button on:click={() => (showEditForm = true)}>
					<EditOutline />
				</button>
			{/if}

			{#if !showEditForm}
				<div class="flex max-w-sm ml-auto my-auto gap-x-2">
					<form
						class="inline-flex gap-x-2"
						method="POST"
						action="/order?/setShipmentConfirmedDelivered"
						use:enhance
						on:submit|preventDefault={(e) => {
							console.dir('form submit setShipmentConfirmedDelivered');
							//showEditForm = false;
						}}
					>
						<input type="hidden" name="shipment_id" bind:value={shipmentInfo.id} />
						{#if !shipmentInfo?.confirmed_delivery_date}
							<input type="hidden" name="confirmed_delivery_date" value={new Date().toISOString()} />
						{/if}

						<button
							class="mt-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
							on:click={() => {
								/* itemShipments = itemShipments.filter((v, i) => i?.shipment?.id !== selectedOis?.shipment?.id); */
							}}
						>
							{#if shipmentInfo?.confirmed_delivery_date}
								<button
									class="mt-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
									on:click={() => {
										/* itemShipments = itemShipments.filter((v, i) => i?.shipment?.id !== selectedOis?.shipment?.id); */
									}}
								>
									<div>
										<UserIcon
											size="sm"
											user={shipmentInfo?.userByConfirmedDeliveryUserId}
											buttonClass="!p-0 !pr-2 text-white"
										>
											<img
												style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(900%) hue-rotate(70deg)"
												width="24"
												height="24"
												src="https://img.icons8.com/windows/32/delivered-box.png"
												alt="delivered-box"
											/>
										</UserIcon>
									</div>
									<Tooltip defaultClass="px-1 py-2 text-xs w-32" placement="left">
										Delivery confirmed by {shipmentInfo?.userByConfirmedDeliveryUserId?.username} @ {datetimeFormat(
											shipmentInfo?.confirmed_delivery_date
										)}
									</Tooltip>
								</button>
							{:else}
								<button
									class="mt-auto hover:text-red-600 disabled:text-inherit disabled:cursor-not-allowed disabled:opacity-50"
									on:click={() => {
										/* itemShipments = itemShipments.filter((v, i) => i?.shipment?.id !== selectedOis?.shipment?.id); */
									}}
								>
									<img
										class="opacity-40 hover:opacity-75"
										style="filter: invert(50%)"
										width="24"
										height="24"
										src="https://img.icons8.com/windows/32/delivered-box.png"
										alt="delivered-box"
									/>
								</button>
							{/if}
						</button>
					</form>

					{#if shipmentInfo?.tracking?.tracking_number && shipmentInfo?.tracking?.carrier_code}
						<div class="my-auto">
							<TrackingStatus tracking={shipmentInfo?.tracking} showText={false} showPopover={true} width={24} height={24} />
						</div>
					{/if}
				</div>
			{/if}
		</div>
		<div>
			{#if showItems}
				<ShipmentItemsTable shipmentAllocations={shipmentInfo?.orders_items_shipments} />
			{/if}
		</div>
	</Modal>
{/if}
