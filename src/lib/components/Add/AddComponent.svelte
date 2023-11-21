<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import {
		Badge,
		Button,
		Checkbox,
		Input,
		Label,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { Plus } from 'svelte-heros-v2';
	import { messagesStore } from 'svelte-legos';
	import TableBodyCellEditable from '../Misc/Table/TableBodyCellEditable.svelte';
	const urqlClient = getContextClient();
	export let id: string = '';
	export let name: string = '';
	export let description: string = '';
	export let image: string = '';
	export let images: string[] = [];
	export let properties: Record<string, any> = {
		type: 'SMT'
	};

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
		if (!name || !description) {
			messagesStore('Component name & description must be set', 'warning');
			return;
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
			{ id, name, description, image_url: image, properties: isSMT ? { type: 'SMT' } : {} }
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

	let isSMT = true;

	let descriptionTokens = [];
	let descriptionProperties = {};
	$: {
		let tokens = description.split(' ')?.map((t) => {
			t = t.toLowerCase();
			if (['cap', 'capacitor', 'res', 'resistor'].includes(t)) {
				let comp = t === 'cap' || t === 'capacitor' ? 'CAP' : 'RES';
				descriptionProperties.component = comp;
				return { type: 'type', value: comp };
			}
		});

		let valueTokens = tokens?.map((t) => {
			if (!t?.type) return;
			if (t.type === 'CAP') {
				console.log('isCap');
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

<div class="grid grid-cols-3">
	<div class="">
		<Label for="small-input" class="block">Name</Label>
		<Input id="small-input" size="sm" placeholder="Part name/number" bind:value={name} />

		<Label for="small-input" class="block mt-2">Description</Label>
		<Input id="small-input" size="sm" placeholder="Part description" bind:value={description} />

		<Label for="small-input" class="block mt-2">Image</Label>
		<Input id="small-input" size="sm" placeholder="Part image url" bind:value={image} />

		<Checkbox bind:checked={isSMT}>SMT</Checkbox>
	</div>
	<div class="overflow-x-auto">
		<Table hoverable>
			<TableHead theadClass="text-xs uppercase text-center">
				<TableHeadCell padding="px-1 py-1">#</TableHeadCell>
				<TableHeadCell padding="px-1 py-1">Property</TableHeadCell>
				<TableHeadCell padding="px-1 py-1">Value</TableHeadCell>
				<TableHeadCell padding="px-1 py-1" />
			</TableHead>
			<TableBody>
				{#each Object.entries(properties) as [key, value], idx}
					<TableBodyRow
						class={`cursor-pointer`}
						on:click={() => {
							//goto('/kitting/' + job.id);
						}}
					>
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
							{idx + 1}
						</TableBodyCell>
						<!-- <TableBodyCell>
                            {item.description}
                        </TableBodyCell> -->

						<TableBodyCellEditable
							bind:value={key}
							inputType="text"
							tdClass="px-1 py-1 whitespace-nowrap text-xs text-center"
						>
							{key}
						</TableBodyCellEditable>
						<TableBodyCellEditable bind:value inputType="text" tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
							{value}
						</TableBodyCellEditable>

						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
							<span
								class="cursor-pointer"
								on:click={() => {
									//quotedItems = quotedItems.filter((_, i) => i !== idx);
								}}
							>
								❌
							</span>
						</TableBodyCell>
					</TableBodyRow>
				{:else}
					<TableBodyRow>
						<TableBodyCell colspan="6">Enter quoted items</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
		{#each Object.entries(properties) as [key, value]}
			{key}: {value}
		{/each}
		{#each Object.entries(descriptionProperties) as [key, value]}
			{key}: {value}
		{/each}
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
