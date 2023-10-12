<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import { Button, Input, Label } from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';

	export let id: string;
	export let name: string = '';
	export let description: string = '';
	export let image: string = '';
	export let images: string[] = [];

	if (!name) {
		name = id;
	}

	async function findImages(searchQuery: string) {
		const q = encodeURI(searchQuery);
		if (!q) return;
		const response = await fetch(`/api/serpapi?q=${q}&engine=google_images&nfpr=1&safe=active`);
		const result = await response.json();
		if (result?.images_results) {
			console.log('image search success', result?.images_results);
			images = result?.images_results
				?.map((r) => {
					return r.original;
				})
				?.slice(0, 11);
		} else {
			console.log('image search fail', response);
		}
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
					insert_parts_data_one(object: { id: $id, name: $name, description: $description, image_url: $image_url }) {
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
			messagesStore('Inserted component: ' + mutationResult.data.insert_parts_data_one.id, 'success');
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
	<div class="my-2 p-4">
		<Button color="green" size="sm" on:click={() => addComponent()}>Add ➕</Button>
		<a target="_blank" href={`https://octopart.com/search?q=${name}&currency=GBP`}>
			<Button color="blue" size="sm" class="w-fit h-fit mx-4">Search Octopart 🔎</Button>
		</a>
		<Button
			color="blue"
			size="sm"
			on:click={() => {
				findImages(name);
			}}
		>
			Find images 📷
		</Button>
		{#if image}
			<img class="w-28 m-2" src={image} />
		{/if}
		{#if images}
			<div class="grid grid-cols-6 gap-2 p-2 overflow-x-auto">
				{#each images as img}
					<div>
						<img class="w-28 cursor-pointer" src={img} on:click={() => (image = img)} />
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
