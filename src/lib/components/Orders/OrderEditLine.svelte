<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql } from '@urql/svelte';
	import {
		Badge,
		Button,
		Label,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { EditOutline } from 'flowbite-svelte-icons';
	import { messagesStore } from 'svelte-legos';

	interface Category {
		id: string | null;
		text?: string;
	}

	export let line;
	export let part: string = line?.part || '';
	export let spn: string = line?.spn || '';
	export let quantity: number = line?.quantity || 0;
	export let price: number = line?.price || 0;
	export let category: string = line?.category || 'Component';
	export let categories: Category[] = [
		{ id: null, text: 'Unknown' },
		{ id: 'Component' },
		{ id: 'Tooling' },
		{ id: 'PCB' },
		{ id: 'Consumables' },
		{ id: 'Other' }
	];
	export let adding = false;

	let originalPart = part;
	let originalSPN = spn;
	let originalQuantity = quantity;
	let originalPrice = price;
	let originalCategory = category;

	const urqlClient = getContextClient();

	async function save() {
		adding = false;
		if (adding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (!$page?.data?.user?.processes?.purchase) {
			messagesStore('You do not have purchase permission', 'warning');
			return;
		}
		if (quantity <= 0 || price < 0 || !part) {
			messagesStore('Validation error, check you input. (quantity <= 0 || price < 0 || !part)', 'warning');
			return;
		}

		adding = true;
		let mutationResult;
		mutationResult = await urqlClient.mutation(
			gql`
				mutation updateOrderItem($_set: erp_orders_items_set_input!, $id: uuid!) {
					update_erp_orders_items_by_pk(pk_columns: { id: $id }, _set: $_set) {
						id
					}
				}
			`,
			{ id: line?.id, _set: { category, part, spn, price, quantity } }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Updated: ' + mutationResult.data.update_erp_orders_items_by_pk.id, 'success');
			part = '';
			spn = '';
			category = 'Component';
			price = 0;
			quantity = 0;
		}
		adding = false;
	}
</script>

<div class="grid grid-cols-4 gap-2">
	<div class="col-span-2">
		<Label for="small-input">Part/Item</Label>
		<input
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			type="text"
			autocomplete="off"
			bind:value={part}
		/>
	</div>
	<div class="col-span-2">
		<Label for="small-input">Supplier PN</Label>
		<input
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			type="text"
			autocomplete="off"
			bind:value={spn}
		/>
	</div>
	<div class="col-span-2">
		<Label for="small-input">Quantity</Label>
		<input
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			type="number"
			autocomplete="off"
			min="0"
			bind:value={quantity}
		/>
	</div>
	<div class="col-span-2">
		<Label for="small-input">Unit Price</Label>
		<input
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			type="number"
			autocomplete="off"
			min="0"
			bind:value={price}
		/>
	</div>

	<div class="col-span-2">
		<Label for="small-input">Category</Label>
		<select
			class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
			bind:value={category}
		>
			{#each categories as { id, text }}
				<option value={id}>
					{text || id}
				</option>
			{/each}
		</select>
	</div>
</div>

<div class="flex pt-6">
	<div class="mx-auto">
		<Table>
			<TableHead>
				<TableHeadCell>Part</TableHeadCell>
				<TableHeadCell>Order Qty</TableHeadCell>
				<TableHeadCell>Unit Cost</TableHeadCell>
				<TableHeadCell>Total Cost</TableHeadCell>
			</TableHead>
			<TableBody>
				<TableBodyRow class="p-0 object-right">
					<TableBodyCell>
						<div>
							<p>{part}</p>
							{#if spn}
								<p class="text-xs italic">{spn}</p>
							{/if}
						</div>
					</TableBodyCell>
					<TableBodyCell>
						<Badge class="mx-0.5" color={'blue'}>
							{quantity}
						</Badge>
					</TableBodyCell>
					<TableBodyCell>
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(price)}
					</TableBodyCell>
					<TableBodyCell>
						{new Intl.NumberFormat('en-GB', {
							style: 'currency',
							currency: 'GBP'
						}).format(Math.round((price * quantity + Number.EPSILON) * 100) / 100 || 0)}
					</TableBodyCell>
				</TableBodyRow>
			</TableBody>
		</Table>
	</div>
</div>

<div class="flex">
	<div class="my-auto mx-auto pt-4">
		<Button
			color="green"
			on:click={() => save()}
			disabled={quantity <= 0 ||
				price < 0 ||
				!part ||
				adding ||
				(originalPart === part &&
					originalSPN === spn &&
					originalQuantity === quantity &&
					originalPrice === price &&
					originalCategory === category)}
		>
			Update <EditOutline size="md" />
		</Button>
	</div>
</div>
