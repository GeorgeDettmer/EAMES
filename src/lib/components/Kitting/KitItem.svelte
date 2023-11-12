<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBodyRow,
		TableBodyCell,
		Tooltip,
		Checkbox,
		Input,
		Button
	} from 'flowbite-svelte';
	import { mediaQuery, messagesStore } from 'svelte-legos';
	import PartInfo from '../PartInfo.svelte';
	import UserIcon from '../UserIcon.svelte';
	import { page } from '$app/stores';
	import { gql } from '@urql/svelte';

	export let part = '';
	export let orderItems = [];
	export let kitItems = [];

	export let arbitraryQuantityVisible = false;
	let arbitraryQuantity = 0;

	orderItems.forEach((i) => {
		i.__quantity = i.quantity;
	});

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

	$: orderTotal = orderItems?.map((i) => i.quantity)?.reduce((a, v) => a + v, 0);
	$: kittingTotal =
		arbitraryQuantity > 0
			? arbitraryQuantity
			: orderItems
					?.filter((i) => i?.__selected)
					?.map((i) => i?.__quantity || 0)
					?.reduce((a, v) => a + v, 0);
	$: console.log(orderItems);
</script>

<div>
	<div class="flex pt-4">
		<div class="w-2/3">
			<PartInfo partId={part} showPopoutButton={false} />
		</div>
		<div class="w-1/3 my-auto">
			<div class="">
				<div class="flex">
					<Button color="blue" disabled={kittingTotal < 1}>Kit {kittingTotal}</Button>
					{#if arbitraryQuantityVisible}
						<div
							class="w-1/2 mx-auto"
							on:mousewheel={(e) => {
								arbitraryQuantity = Math.max(arbitraryQuantity + (e.deltaY > 0 ? -1 : +1), 0);
							}}
						>
							<Input
								size="sm"
								type="number"
								value={arbitraryQuantity}
								on:input={(e) => {
									arbitraryQuantity = Number(e.target.value);
								}}
							/>
						</div>
					{/if}
				</div>
				<div>
					<Checkbox bind:checked={arbitraryQuantityVisible}>Arbitrary quantity</Checkbox>
				</div>
			</div>

			{#each orderItems as orderItem}
				{#if orderItem?.__selected}
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
						<TableBodyCell tdClass="font-sm text-center">{orderItem.order.id}</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">{orderItem.quantity}</TableBodyCell>
					</TableBodyRow>
				{/if}
			{/each}
		</div>
	</div>

	<div class="mt-6">
		<Table>
			<TableHead theadClass="uppercase text-center">
				<TableHeadCell>User</TableHeadCell>
				<TableHeadCell>Time/Date</TableHeadCell>
				<TableHeadCell>Order</TableHeadCell>
				<TableHeadCell>Order Qty</TableHeadCell>
				<TableHeadCell>Quantity</TableHeadCell>
				<TableHeadCell>
					<Checkbox
						on:change={(e) => {
							orderItems.forEach((i) => {
								i.__selected = e.target.checked;
							});
							orderItems = orderItems;
						}}
						disabled={!orderItems.length}
						checked={orderItems.length > 0 && orderItems.filter((i) => i?.__selected).length == orderItems.length}
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
					<TableBodyCell tdClass="font-sm text-center">{orderItem.order.id}</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center">{orderItem.quantity}</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center">
						<div
							class="w-1/2 mx-auto"
							on:mousewheel={(e) => {
								orderItem.__quantity = Math.max(orderItem.__quantity + (e.deltaY > 0 ? -1 : +1), 0);
							}}
						>
							<Input
								size="sm"
								type="number"
								value={orderItem.__quantity}
								on:input={(e) => {
									orderItem.__selected = true;
									orderItem.__quantity = Number(e.target.value);
								}}
							/>
						</div>
					</TableBodyCell>
					<TableBodyCell tdClass="font-sm text-center">
						<Checkbox bind:checked={orderItem.__selected} />
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
				<TableBodyCell />
				<TableBodyCell tdClass="font-sm text-center font-bold">
					{orderItems?.filter((i) => i?.__selected).length}
				</TableBodyCell>
			</TableHead>
		</Table>
	</div>
</div>
