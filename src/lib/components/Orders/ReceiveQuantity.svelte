<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import { Button, Input, Label, Spinner } from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';
	const urqlClient = getContextClient();

	export let orderItemId: string;
	export let quantity: number = 0;

	let quantityAdding = false;
	async function addQuantity() {
		if (quantityAdding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!quantity) {
			messagesStore('Quantity to add must be set & be more than 0', 'warning');
		}
		/* if (!$page?.data?.user?.processes['eng']) {
			alert(
				`You do not have permission to insert components. You have permission for: ${Object.keys(
					$page?.data?.user?.processes
				)}`
			);
			return;
		} */
		quantityAdding = true;
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertRecievedQty($orderItemId: uuid!, $quantity: Int!) {
					insert_erp_orders_items_received_one(object: { orders_items_id: $orderItemId, quantity: $quantity }) {
						id
					}
				}
			`,
			{ orderItemId, quantity }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted receipt: ' + mutationResult.data.insert_erp_orders_items_received_one.id, 'success');
		}
		quantityAdding = false;
	}
</script>

<div class="flex">
	<div>
		<Label for="small-input" class="block mb-2">Quantity</Label>
		<Input id="small-input" size="sm" placeholder="Recieved quantity" bind:value={quantity} />
	</div>
	<div class="my-2 p-4">
		<Button color="green" size="sm" on:click={() => addQuantity()} disabled={quantity < 1}>
			Add ➕
			{#if quantityAdding}
				<Spinner class="ml-3" size="3" color="white" />
			{/if}
		</Button>
	</div>
</div>
