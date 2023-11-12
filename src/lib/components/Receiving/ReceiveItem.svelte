<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
	import { Table, TableHead, TableHeadCell, TableBodyRow, TableBodyCell, Tooltip } from 'flowbite-svelte';
	import { mediaQuery, messagesStore } from 'svelte-legos';
	import ReceiveQuantity from '../Orders/ReceiveQuantity.svelte';
	import PartInfo from '../PartInfo.svelte';
	import UserIcon from '../UserIcon.svelte';
	import { page } from '$app/stores';
	import { gql } from '@urql/svelte';

	export let orderItem;
	export let receiveQuantity = 0;

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

	$: recievedQty = orderItem?.orders_items_receiveds?.reduce((a, v) => a + (v?.quantity || 0), 0);
</script>

<div>
	<div class="grid grid-cols-2">
		<div>
			<p>{orderItem?.part}</p>
			{#if orderItem?.spn}
				<p>{orderItem?.spn}</p>
			{/if}
		</div>
		<ReceiveQuantity orderItemId={orderItem?.id} quantity={receiveQuantity} {orderItem} />
	</div>

	<PartInfo partId={orderItem?.part} />
	{#if orderItem?.orders_items_receiveds}
		<div class="mt-6">
			<Table>
				<TableHead theadClass="uppercase text-center">
					<TableHeadCell>User</TableHeadCell>
					<TableHeadCell>Time/Date</TableHeadCell>
					<TableHeadCell>Quantity</TableHeadCell>
					<TableHeadCell />
				</TableHead>

				{#each orderItem?.orders_items_receiveds as received, idx}
					<TableBodyRow>
						<TableBodyCell tdClass="font-sm text-center">
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
						<TableBodyCell tdClass="font-sm text-center">
							{datetimeFormat(received.updated_at)}
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							{received?.quantity}
						</TableBodyCell>
						<TableBodyCell tdClass="font-sm text-center">
							<span
								class="cursor-pointer"
								on:click={() => {
									//orderItemSelected.orders_items_receiveds[idx] = undefined;
									removeRecieved(received);
								}}
							>
								❌
							</span>
						</TableBodyCell>
					</TableBodyRow>
				{:else}
					<TableBodyCell colspan="3">No receipts for this order item</TableBodyCell>
				{/each}
				<TableHead>
					<TableBodyCell />
					<TableBodyCell />
					<TableBodyCell tdClass="font-sm text-center font-bold">
						{recievedQty}/{orderItem?.quantity}
					</TableBodyCell>
					<TableBodyCell />
				</TableHead>
			</Table>
		</div>
	{/if}
</div>
