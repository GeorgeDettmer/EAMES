<script lang="ts">
	import { reference } from '@popperjs/core';
	import { getContextClient, gql, queryStore } from '@urql/svelte';

	export let bomId: string;

	$: bomStore = queryStore({
		client: getContextClient(),
		query: gql`
			query bom($bomId: uuid!) {
				bom_by_pk(id: $bomId) {
					id
					name
					revision_external
					revision_internal
					created_at
					updated_at
					lines {
						id
						reference
						part
						created_at
						updated_at
						partByPart {
							id
							name
							description
							manufacturer
							polarised
							properties
							created_at
							footprint
							image_url
							images
							kb
							updated_at
						}
					}
				}
			}
		`,
		variables: { bomId }
	});
	$: bom = $bomStore?.data?.bom_by_pk;

	import {
		Badge,
		ImagePlaceholder,
		P,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { writable } from 'svelte/store';
	import { slide } from 'svelte/transition';
	import PartInfo from '../PartInfo.svelte';

	let items = [];

	let lines = new Map();
	$: {
		if (bom?.lines) {
			bom.lines.forEach((line) => {
				console.log(line);
				let part = line?.part || null;
				if (!lines.has(part)) {
					lines.set(part, []);
				}
				lines.get(part).push(line);
			});
			items = lines.keys();
		}
		console.log(lines, items);
	}

	const sortKey = writable('id'); // default sort key
	const sortDirection = writable(1); // default sort direction (ascending)
	const sortItems = writable(items.slice()); // make a copy of the items array

	// Define a function to sort the items
	const sortTable = (key) => {
		// If the same key is clicked, reverse the sort direction
		if ($sortKey === key) {
			sortDirection.update((val) => -val);
		} else {
			sortKey.set(key);
			sortDirection.set(1);
		}
	};

	/* $: {
		const key = $sortKey;
		const direction = $sortDirection;
		const sorted = [...$sortItems].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			if (aVal < bVal) {
				return -direction;
			} else if (aVal > bVal) {
				return direction;
			}
			return 0;
		});
		sortItems.set(sorted);
	} */

	let openRow: number;
</script>

{#if $bomStore.fetching}
	<p>Loading...</p>
{:else if $bomStore.error}
	<h1 class="text-red-600">Part query error</h1>
	<p class="text-red-600">{$bomStore.error.message}</p>
{:else if bom}
	<!-- <pre>{JSON.stringify(bom, null, 2)}</pre> -->

	<Table hoverable={true}>
		<TableHead>
			<TableHeadCell on:click={() => sortTable('id')}>#</TableHeadCell>
			<TableHeadCell on:click={() => sortTable('maker')}>Part</TableHeadCell>
			<TableHeadCell on:click={() => sortTable('type')}>References</TableHeadCell>
			<TableHeadCell on:click={() => sortTable('make')}>Qty</TableHeadCell>
		</TableHead>
		<TableBody class="divide-y">
			{#each lines.keys() as lineKey, idx}
				{@const line = lines.get(lineKey)}
				{@const references = line?.map((l) => l?.reference) || []}
				<TableBodyRow
					class="cursor-pointer"
					on:click={() => {
						openRow = openRow === idx ? null : idx;
					}}
				>
					<TableBodyCell>{idx + 1}</TableBodyCell>
					<TableBodyCell>{lineKey || ''}</TableBodyCell>

					<TableBodyCell>
						{#each references as reference}
							<Badge class="mx-0.5" color="blue">{reference}</Badge>
						{/each}
					</TableBodyCell>
					<TableBodyCell>{references?.length}</TableBodyCell>
				</TableBodyRow>
				{#if openRow === idx}
					<TableBodyRow>
						<TableBodyCell colspan="4" class="p-0">
							<div class="px-2 py-3" transition:slide={{ duration: 300, axis: 'y' }}>
								<PartInfo partId={lineKey} />
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/if}
			{/each}
		</TableBody>
	</Table>
{/if}
