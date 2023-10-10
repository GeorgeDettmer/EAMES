<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import { Button, Input, Label } from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';

	export let id: String;
	export let name: String = '';
	export let description: String = '';
	export let image: String = '';

	if (!name) {
		name = id;
	}

	async function addComponent() {
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!name || !description || !image) {
			messagesStore('Component name, description and image url must be set', 'warning');
		}
		if (!$page?.data?.user?.processes['eng']) {
			alert(
				`You do not have permission to insert components. You have permission for: ${Object.keys(
					$page?.data?.user?.processes
				)}`
			);
			return;
		}
		let mutationResult;
		const urqlClient = getContextClient();
		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertComponent($id: String!, $name: String = "", $description: String = "", $image_url: String = "") {
					insert_parts_one(object: { id: $id, name: $name, description: $description, image_url: $image_url }) {
						id
					}
				}
			`,
			{ id, name, description, image_url: image }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted component: ' + mutationResult.data.insert_parts_one.id, 'success');
		}
	}
</script>

<div class="grid grid-cols-2">
	<div>
		<Label for="small-input" class="block mb-2">Name</Label>
		<Input id="small-input" size="sm" placeholder="Part name/number" bind:value={name} />

		<Label for="small-input" class="block mb-2">Description</Label>
		<Input id="small-input" size="sm" placeholder="Part description" bind:value={description} />

		<Label for="small-input" class="block mb-2">Image</Label>
		<Input id="small-input" size="sm" placeholder="Part image url" bind:value={image} />
	</div>
	<div class="my-2">
		<Button color="green" on:click={addComponent}>Add ➕</Button>
		<a target="_blank" href={`https://octopart.com/search?q=${name}&currency=GBP`}
			><Button color="green" class="w-fit h-fit mx-4">Search Octopart</Button></a
		>
		{#if image}
			<img class="w-28 m-2" src={image} />
		{/if}
	</div>
</div>
