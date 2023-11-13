<script lang="ts">
	import { clamp, classes, datetimeFormat } from '$lib/utils';
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBodyRow,
		TableBodyCell,
		Tooltip,
		Checkbox,
		Input,
		Button,
		Dropdown,
		Helper,
		Radio,
		Spinner
	} from 'flowbite-svelte';
	import { mediaQuery, messagesStore } from 'svelte-legos';
	import PartInfo from '../PartInfo.svelte';
	import UserIcon from '../UserIcon.svelte';
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import { ChevronDownSolid } from 'flowbite-svelte-icons';

	export let part;
	export let orderItems = [];
	export let kitItems = [];
	export let kits = [];
	export let kit = kits?.[0];
	export let arbitraryQuantityVisible = false;

	let arbitraryQuantity = 1;

	orderItems.forEach((i) => {
		let kitted = kitItems?.filter((ki) => ki.orders_item?.id === i.id);
		let kittedQty = kitted?.reduce((a, v) => (a = a + v.quantity), 0);
		if (!i?.__quantity) {
			i.__quantity = i.quantity;
		}
		if (!i?.__selected) {
			i.__selected = true;
		}
		if (kittedQty >= i.quantity) {
			i.__selected = false;
			i.__quantity = 0;
			i.__kitted = true;
		}
	});
	const urqlClient = getContextClient();
	let quantityAdding = false;
	async function addQuantity() {
		if (quantityAdding) return;
		//TODO: Fix quantity control
		/* if (recievedQty >= orderItem.quantity || recievedQty + quantity > orderItem.quantity) {
			messagesStore('Quantity over order total', 'warning');
			return;
		} */
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (kittingTotal < 1) {
			messagesStore('Quantity to add must more than 0', 'warning');
		}
		if (!kit?.id) {
			messagesStore('No kit seleted', 'warning');
		}

		quantityAdding = true;
		let mutationResult;

		if (arbitraryQuantityVisible) {
			mutationResult = await urqlClient.mutation(
				gql`
					mutation insertKitQty($kit_id: uuid!, $quantity: Int!, $part: String) {
						insert_erp_kits_items_one(object: { kit_id: $kit_id, quantity: $quantity, part: $part }) {
							id
						}
					}
				`,
				{ kit_id: kit.id, quantity: arbitraryQuantity, part }
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
				messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
			} else {
				console.log('MUTATION RESULT: ', mutationResult);
				messagesStore('Inserted: ' + mutationResult.data.insert_erp_kits_items_one.id, 'success');
			}
		} else {
			let itemsToKit = orderItems?.filter((i) => i.__selected && i.__quantity);
			let items = itemsToKit?.map((i) => {
				return {
					kit_id: kit.id,
					order_item_id: i.id,
					part: i?.part,
					quantity: i.__quantity
				};
			});
			console.log('itemstoadd:', items);
			mutationResult = await urqlClient.mutation(
				gql`
					mutation insertOrderItems($items: [erp_kits_items_insert_input!] = {}) {
						insert_erp_kits_items(objects: $items) {
							returning {
								id
							}
						}
					}
				`,
				{ items }
			);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
				messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
			} else {
				console.log('MUTATION RESULT: ', mutationResult);
				messagesStore('Inserted: ' + mutationResult.data, 'success');
			}
		}

		quantityAdding = false;
	}

	$: orderTotal = orderItems?.map((i) => i.quantity)?.reduce((a, v) => a + v, 0);
	$: kittingTotal = arbitraryQuantityVisible
		? arbitraryQuantity
		: orderItems
				?.filter((i) => i?.__selected)
				?.map((i) => i?.__quantity || 0)
				?.reduce((a, v) => a + v, 0);
	$: console.log(orderItems);
</script>

<div>
	<div class="flex pt-4">
		<div class="w-1/2">
			{#if !arbitraryQuantityVisible}
				<p class="pb-2 text-lg">Kit {kittingTotal} from {orderItems?.filter((i) => i.__selected).length} order(s)</p>
			{:else}
				<p class="text-lg underline text-red-600">Kit {kittingTotal}</p>
				<p class="pb-2 italic text-red-600">arbitrary amount not associated with an order</p>
			{/if}
			<PartInfo partId={part} showPopoutButton={false} />
		</div>
		<div class="w-1/4">
			<ul class="p-2">
				<p class="uppercase">{kit?.id?.split('-')?.slice(-1)}</p>
				{#each kits as k, idx}
					<li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600 uppercase">
						<Radio
							name="kit_group"
							group={'kit'}
							value={k.id}
							on:change={(e) => {
								kit = k;
							}}
						>
							{k.id.split('-').slice(-1)}
						</Radio>
						<Helper class="pl-6">Kit info here...</Helper>
					</li>
				{/each}
			</ul>
		</div>
		<div class="w-1/4">
			<div class="">
				<div class="flex">
					<Button color="blue" size="sm" disabled={kittingTotal < 1} on:click={() => addQuantity()}>
						Add
						{#if quantityAdding}
							<Spinner class="ml-3" size="3" color="white" />
						{/if}
					</Button>
					{#if arbitraryQuantityVisible}
						<div
							class="w-1/2 mx-auto"
							on:mousewheel={(e) => {
								arbitraryQuantity = Math.max(arbitraryQuantity + (e.deltaY > 0 ? -1 : +1), 1);
							}}
						>
							<Input
								size="sm"
								type="number"
								value={arbitraryQuantity}
								on:input={(e) => {
									arbitraryQuantity = Math.max(Number(e.target.value), 1);
								}}
							/>
						</div>
					{/if}
				</div>
				<div>
					<Checkbox bind:checked={arbitraryQuantityVisible}>Arbitrary quantity</Checkbox>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-6">
		{#if !arbitraryQuantityVisible}
			<Table>
				<TableHead theadClass="uppercase text-center">
					<TableHeadCell>Buyer</TableHeadCell>
					<TableHeadCell>Time/Date</TableHeadCell>
					<TableHeadCell>Order</TableHeadCell>
					<TableHeadCell>Order Qty</TableHeadCell>
					<TableHeadCell>Quantity</TableHeadCell>
					<TableHeadCell>
						<Checkbox
							on:change={(e) => {
								orderItems.forEach((i) => {
									if (!i.__kitted) {
										i.__selected = e.target.checked;
									}
								});
								orderItems = orderItems;
							}}
							disabled={!orderItems.length}
							checked={orderItems.length > 0 && orderItems.filter((i) => !i?.__selected && !i?.__kitted).length == 0}
						/>
					</TableHeadCell>
				</TableHead>

				{#each orderItems as orderItem, idx}
					<TableBodyRow>
						<TableBodyCell tdClass="font-sm text-center">
							<UserIcon size="xs" user={orderItem?.user}>
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
							{datetimeFormat(orderItem.updated_at)}
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							<a href={`${window.origin}/order/${orderItem.order.id}`} target="_blank" class={classes.link}>
								{orderItem.order.id}
							</a>
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">{orderItem.quantity}</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							<div
								class="w-1/2 mx-auto"
								on:mousewheel={(e) => {
									orderItem.__quantity = clamp(orderItem.__quantity + (e.deltaY > 0 ? -1 : +1), 1, orderItem.quantity);
								}}
							>
								<Input
									size="sm"
									type="number"
									value={orderItem.__quantity}
									disabled={!orderItem?.__selected}
									on:input={(e) => {
										orderItem.__selected = true;
										orderItem.__quantity = clamp(Number(e.target.value), 1, orderItem.quantity);
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
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{kittingTotal}
					</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{orderItems?.filter((i) => i?.__selected).length}
					</TableBodyCell>
				</TableHead>
			</Table>
		{/if}
	</div>
</div>
