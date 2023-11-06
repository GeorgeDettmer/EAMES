<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql, subscriptionStore } from '@urql/svelte';
	import { Button, Input, Label, Radio, Spinner } from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';
	const urqlClient = getContextClient();

	export let orderItemId: string;
	export let quantity: number = 0;
	export let part_id: string | undefined = undefined;
	export let kits: string[] | undefined = undefined;

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
				mutation insertRecievedQty($orderItemId: uuid!, $quantity: Int!, $part_id: text) {
					insert_erp_kits_items_one(object: { orders_items_id: $orderItemId, quantity: $quantity, part_id: $part_id }) {
						id
					}
				}
			`,
			{ orderItemId, quantity, part_id }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted receipt: ' + mutationResult.data.insert_erp_kits_items_one.id, 'success');
		}
		quantityAdding = false;
	}
</script>

<div class="flex">
	{JSON.stringify(kits)}
	<div>
		<Label for="small-input" class="block mb-2">Quantity</Label>
		<Input id="small-input" size="sm" placeholder="Kit quantity" bind:value={quantity} />
		<ul
			class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x divide-gray-200 dark:divide-gray-600"
		>
			{#each kits as kit}
				<li class="w-full"><Radio name="hor-list" class="p-3">{kit.id}</Radio></li>
			{:else}
				<Button>Create new kit</Button>
			{/each}
		</ul>
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
