<script lang="ts">
	import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Button } from 'flowbite-svelte';
	import OrderSetTracking from './OrderSetTracking.svelte';
	import TrackingStatus from './TrackingStatus.svelte';
	import { onMount } from 'svelte';
	import { ChevronDoubleDownOutline, EditOutline, PlusOutline } from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import { getContextClient, gql } from '@urql/svelte';

	interface Tracking {
		carrier_code?: string;
		tracking_number?: string;
		tracking_url?: string;
	}

	export let orders_items = [];

	let tracking: Tracking[] = [];
	onMount(() => {
		let trackingUnique = new Set();
		orders_items.forEach((oi) => {
			let t = oi?.tracking;
			if (!t) return;
			if (!t?.length) {
				t = [t];
			}
			t?.forEach((t) => {
				const { tracking_number, carrier_code, tracking_url } = t;
				if (!carrier_code && carrier_code?.toLowerCase() === 'other') {
					tracking = [...tracking, { tracking_number, carrier_code, tracking_url }];
					return;
				}
				if (!carrier_code || !tracking_number) return;
				if (!trackingUnique.has(carrier_code + tracking_number)) {
					trackingUnique.add(carrier_code + tracking_number);
					tracking = [...tracking, { tracking_number, carrier_code, tracking_url }];
					return;
				}
			});
		});
		if (tracking.length) {
			groupSetTracking = tracking?.[0];
		}
		console.log('initial trackings', trackingUnique.entries(), tracking);
	});

	let groupSetTracking: Tracking;
	const urqlClient = getContextClient();
	let saving = false;
	async function save() {
		saving = false;
		if (saving) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!$page?.data?.user?.processes?.purchase) {
			messagesStore('You do not have purchase permission', 'warning');
			return;
		}

		let updates = orders_items.map((oi) => {
			return {
				where: { _and: { id: { _eq: oi.id }, order_id: { _eq: oi.order_id } } },
				_set: { tracking: Array.isArray(oi.tracking) ? oi.tracking : [oi.tracking] }
			};
		});

		saving = true;
		let mutationResult;
		mutationResult = await urqlClient.mutation(
			gql`
				mutation updateOrderItemTracking($updates: [erp_orders_items_updates!]!) {
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
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Updated: ' + mutationResult.data.update_erp_orders_items_many, 'success');
			tracking = [];
		}
		saving = false;
	}
</script>

<div class="">
	<OrderSetTracking bind:tracking />
	<div class="mr-auto pt-1">
		<button
			class="hover:text-green-600"
			on:click={() => {
				tracking = [...tracking, { tracking_number: '', carrier_code: undefined }];
			}}
		>
			<PlusOutline size="md" />
		</button>
	</div>
</div>

<Table>
	<TableHead theadClass="text-xs uppercase text-center">
		<TableHeadCell padding="px-1 py-1">Order Item</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Category</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">PN</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">SPN</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Qty</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Cost</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Total</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">
			<div class="flex">
				<select
					class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					bind:value={groupSetTracking}
				>
					<option value={{}} />
					{#each tracking as t, idx}
						<option value={t}>
							{idx + 1}) {t.carrier_code}-{t.tracking_number}
						</option>
					{/each}
				</select>
				<button
					on:click={() => {
						orders_items.forEach((oi) => {
							oi.tracking = groupSetTracking;
						});
						orders_items = orders_items;
					}}
				>
					<ChevronDoubleDownOutline size="sm" class="text-gray-400" />
				</button>
			</div>
		</TableHeadCell>
	</TableHead>
	<TableBody>
		{#each orders_items as item, idx}
			<TableBodyRow>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<p class={'uppercase'}>
						{idx + 1}
					</p>
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
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: item?.currencyCode || 'GBP'
						/* roundingPriority: 'morePrecision' */
					}).format(item?.price || 0)}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: item?.currencyCode || 'GBP'
						/* roundingPriority: 'morePrecision' */
					}).format(item?.price * item?.quantity || 0)}
				</TableBodyCell>

				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs">
					<div class="flex gap-x-1">
						<select
							class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
							bind:value={item.tracking}
						>
							<option value={{}} />
							{#each tracking as t, idx}
								<option value={t}>
									{idx + 1}) {t.carrier_code}-{t.tracking_number}
								</option>
							{/each}
						</select>
						<TrackingStatus bind:tracking={item.tracking} showText={true} width={24} height={24} />
					</div>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>

<div class="flex">
	<div class="my-auto mx-auto pt-4">
		<Button color="green" on:click={() => save()}>
			Update <EditOutline size="md" />
		</Button>
	</div>
</div>
