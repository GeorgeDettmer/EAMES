<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import { Button, Checkbox, Input, Label, Spinner } from 'flowbite-svelte';
	import { messagesStore } from 'svelte-legos';
	const urqlClient = getContextClient();
	export let id: string = '';
	export let name: string = '';
	export let description: string = '';
	export let image: string = '';
	export let images: string[] = [];

	if (!name) {
		name = id;
	}

	let supplierFilters = ['digikey', 'farnell', 'mouser', 'newark', 'octopart'];
	let supplierFilter = true;
	let filter_inUrl = supplierFilters;
	let imageSearching = false;

	$: imagesFiltered = images
		?.map((url) => {
			if (filter_inUrl.length > 0) {
				return filter_inUrl.some((i) => url?.toLowerCase()?.includes(i)) ? url : undefined;
			}
			return url;
		})
		?.slice(0, 12);
	$: console.log(imagesFiltered);

	async function findImages(searchQuery: string) {
		if (imageSearching) return;
		const q = encodeURI(searchQuery);
		if (!q) return;
		imageSearching = true;
		const response = await fetch(`/api/serpapi?q=${q}&engine=google_images&nfpr=1&safe=active`);
		const result = await response.json();
		if (result?.images_results) {
			console.log('image search success', result?.images_results);
			images = result?.images_results?.map((r) => {
				return r.original;
			});
		} else {
			console.log('image search fail', response);
		}
		imageSearching = false;
	}

	let componentAdding = false;
	async function addComponent() {
		if (componentAdding) return;
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
		if (!id) {
			id = name;
		}
		componentAdding = true;
		let mutationResult;

		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertComponent(
					$id: String!
					$name: String = ""
					$description: String = ""
					$image_url: String = ""
					$properties: json = ""
				) {
					insert_parts_data_one(
						object: { id: $id, name: $name, description: $description, image_url: $image_url, properties: $properties }
					) {
						id
					}
					insert_parts_one(object: { id: $id, name: $name, part_data_id: $id }) {
						id
					}
				}
			`,
			{ id: id.trim(), name: name.trim(), description, image_url: image, properties: type ? { type } : {} }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted component: ' + mutationResult.data.insert_parts_data_one.id, 'success');
		}
		componentAdding = false;
	}

	let type: 'THT' | 'SMT' | '';
	let isSMT = true;

	let descriptionTokens = [];
	$: {
		let tokens = description.split(' ')?.map((t) => {
			t = t.toLowerCase();
			if (['cap', 'capacitor', 'res', 'resistor'].includes(t)) {
				return { type: 'type', value: t === 'cap' || t === 'capacitor' ? 'CAP' : 'RES' };
			}
		});

		let valueTokens = tokens?.map((t) => {
			if (!t?.type) return;
			if (t.type === 'CAP') {
				console.log('isCAp');
				if (['u', 'n', 'p'].includes(t)) {
					return { type: 'value', value: t };
				}
			}
			if (t.type === 'RES') {
				if (['k', 'm'].includes(t)) {
					return { type: 'value', value: t };
				}
			}
		});
		descriptionTokens = [...tokens, ...valueTokens];
	}
</script>

<div class="grid grid-cols-2">
	<div class="flex">
		<div class="w-1/2">
			<div>
				<Label for="small-input" class="block mb-2">Name</Label>
				<Input id="small-input" size="sm" placeholder="Part name/number" bind:value={name} />

				<Label for="small-input" class="block mb-2">Description</Label>
				<Input id="small-input" size="sm" placeholder="Part description" bind:value={description} />

				<Label for="small-input" class="block mb-2">Image</Label>
				<Input id="small-input" size="sm" placeholder="Part image url" bind:value={image} />

				<!-- <Checkbox bind:checked={isSMT}>SMT</Checkbox>
				{type} -->
				<ul>
					<li class="rounded p-0.5 uppercase">
						<Label class={'flex items-center'}>
							<input
								type="radio"
								bind:group={type}
								value="SMT"
								class={'mr-2 w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'}
							/>
							SMT
						</Label>
						<Label class={'flex items-center'}>
							<input
								type="radio"
								bind:group={type}
								value="THT"
								class={'mr-2 w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'}
							/>
							THT
						</Label>
						<Label class={'flex items-center'}>
							<input
								type="radio"
								bind:group={type}
								value=""
								class={'mr-2 w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'}
							/>
							N/A
						</Label>
						<!-- <Helper class="pl-6">{k.id.split('-').slice(-1)}</Helper> -->
					</li>
				</ul>
			</div>
		</div>
		<div class="1/2">
			<!-- <p class="flex-wrap">{description.split(' ')}</p> -->
			<div class="ml-8">
				<ul class="list-disc">
					{#each description.split(' ').filter((d) => !!d) as t}
						<li>{t}</li>
					{/each}
				</ul>
			</div>
			{#each descriptionTokens as token}
				{#if token?.value && token?.type}
					<p>{token?.type}: {token?.value}</p>
				{/if}
			{/each}
		</div>
	</div>

	<div class="my-2 p-4">
		<Button color="green" size="sm" on:click={() => addComponent()}>
			Add ➕
			{#if componentAdding}
				<Spinner class="ml-3" size="3" color="white" />
			{/if}
		</Button>
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
			{#if imageSearching}
				<Spinner class="ml-3" size="3" color="white" />
			{/if}
		</Button>
		<div class="flex p-1">
			<div class="w-3/4 m-1">
				{#if image}
					<img src={image} />
				{/if}
			</div>
			{#if imagesFiltered.length > 0}
				<div>
					<a
						on:click={() => {
							if (filter_inUrl.length > 0) {
								filter_inUrl = [];
								supplierFilter = false;
							} else {
								filter_inUrl = supplierFilters;
								supplierFilter = true;
							}
						}}
						class="cursor-pointer text-xs"
						class:line-through={!supplierFilter}
					>
						Supplier Filter
					</a>
					<div class="grid grid-cols-6 gap-0.5 p-0.5 overflow-x-auto">
						{#each imagesFiltered as img}
							{#if img}
								<div>
									<img class="w-28 cursor-pointer hover:shadow-md" src={img} on:click={() => (image = img)} />
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
