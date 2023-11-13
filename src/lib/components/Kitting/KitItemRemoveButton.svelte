<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import { Button, Spinner } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';
	import { messagesStore } from 'svelte-legos';

	export let id: number;
	export let disabled: boolean = false;

	const urqlClient = getContextClient();
	const dispatch = createEventDispatcher();

	let removing = false;
	async function remove() {
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
		removing = true;
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation removeKitItem($id: Int!) {
					delete_erp_kits_items_by_pk(id: $id) {
						id
					}
				}
			`,
			{ id }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
			dispatch('error', mutationResult);
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Removed: ' + mutationResult.data.delete_erp_kits_items_by_pk.id, 'success');
			dispatch('success', mutationResult);
		}
		removing = false;
	}
</script>

<Button size="xs" color="red" {disabled} on:click={() => remove()}>
	<slot />
	{#if removing}
		<Spinner class="ml-3" size="3" color="white" />
	{/if}
</Button>
