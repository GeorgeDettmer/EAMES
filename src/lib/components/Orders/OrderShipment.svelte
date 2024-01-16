<script lang="ts">
	import type { Shipment } from '$lib/types';
	import type { Placement } from '@popperjs/core';
	import { getContextClient, gql, queryStore } from '@urql/svelte';
	import {
		Badge,
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
	import { datetimeFormat, padString } from '$lib/utils';
	import TrackingStatus from './TrackingStatus.svelte';

	export let shipmentId: string = '';
	export let shipment: Shipment | undefined = undefined;
	export let showItems: boolean = false;
	export let tooltipPlacement: Placement = 'left';
	export let showDetailsModal: boolean = true;
	export let modalOpen: boolean = false;

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
	<div
		on:click={() => (modalOpen = true)}
		class="cursor-pointer h-14 w-auto p-4 rounded font-medium inline-flex items-center justify-center {shipmentInfo
			?.orders_items_shipments?.length
			? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 '
			: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 '}"
	>
		<div class="overflow-hidden grid grid-cols-2 gap-x-2">
			<div>
				<p class="font-bold">{shipmentInfo?.carrier?.name}</p>
			</div>
			<div class="justify-end text-right">
				<div>
					<p>SHP{padString(String(shipmentInfo?.id || ''), 4)}</p>
				</div>
				<div>
					<!-- {#if order?.reference}
						<p class="text-xs">#{order.reference}</p>
					{/if} -->
				</div>
			</div>
			<div class="w-fit">
				<TrackingStatus tracking={shipmentInfo?.tracking} showText={false} showPopover={false} />
				<!-- <p>
					{shipmentInfo?.tracking?.tracking_number}
				</p> -->
			</div>
			<div>
				<!-- <p class="float-right">{shipmentInfo?.orders_items_shipments?.length}</p> -->
				<p class="float-right">{shipmentInfo?.expected_delivery_date}</p>
			</div>
		</div>
		<slot />
	</div>
	<!-- <div on:click={() => (modalOpen = !modalOpen)} class:cursor-pointer={showDetails}>
		<img src="https://img.icons8.com/ios/50/cardboard-box.png" alt="cardboard-box" />
	</div> -->
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
							{shipmentInfo?.carrier?.name
								?.split(' ')
								?.map((s) => s?.[0]?.toUpperCase())
								.join('')}
						</p>
					{/if}
				</a>
			</div>
			<div class="my-auto">
				<p class="text-lg font-semibold leading-none text-gray-900 dark:text-white">
					<a href="/supplier/{shipmentInfo?.carrier?.id}" class="hover:underline">{shipmentInfo?.carrier?.name}</a>
				</p>
				{#if shipmentInfo?.tracking?.tracking_number}
					{#if shipmentInfo?.tracking?.tracking_url}
						<a class="text-xs hover:underline" href={shipmentInfo?.tracking?.tracking_url} target="_blank">
							{shipmentInfo?.tracking?.tracking_number} ({shipmentInfo?.tracking?.id})
						</a>
					{:else}
						<p class="text-xs">
							{shipmentInfo?.tracking?.tracking_number} ({shipmentInfo?.tracking?.id})
						</p>
					{/if}
				{/if}
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
{:else}
	<div class={'text-base font-semibold leading-none text-gray-900 dark:text-white'}>Shipment info unavailable...</div>
{/if}
{#if showDetailsModal}
	<Modal outsideclose bind:open={modalOpen}>
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
							{shipmentInfo?.carrier?.name
								?.split(' ')
								?.map((s) => s?.[0]?.toUpperCase())
								.join('')}
						</p>
					{/if}
				</a>
			</div>
			<div class="my-auto">
				<p class="text-lg font-semibold leading-none text-gray-900 dark:text-white">
					<a href="/supplier/{shipmentInfo?.carrier?.id}" class="hover:underline">{shipmentInfo?.carrier?.name}</a>
				</p>
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
				{/if}
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
		</div>
		<div>
			{#if showItems}
				<Table>
					<TableHead theadClass="text-xs uppercase text-center">
						<TableHeadCell padding="px-1 py-1">Shipment Item</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">User</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">Category</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">PN</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">SPN</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">Order Qty</TableHeadCell>
						<TableHeadCell padding="px-1 py-1">Shipment Qty</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each shipmentInfo?.orders_items_shipments as ois, idx}
							{@const item = ois.orders_item}
							<TableBodyRow>
								<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
									<p class={'uppercase'}>
										{idx + 1}
									</p>
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
									<UserIcon size="xs" user={item?.user} buttonClass="!p-0 !pr-2 text-white" />
									<Tooltip placement="right">
										<p>
											{#if item?.user?.first_name}
												{item?.user?.first_name}
												{item?.user?.last_name}
											{:else}
												Unknown user...
											{/if}
										</p>
										<p>{datetimeFormat(item.updated_at)}</p>
									</Tooltip>
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
									{item?.category || 'Unknown'}
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
									{item.part}
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
									{item.spn}
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
									{item?.quantity}
								</TableBodyCell>
								<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
									{ois.quantity || item?.quantity}
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</div>
	</Modal>
{/if}
