<script lang="ts">
	export let bom;
	export let job = {};
	export let partsInLibrary = [];

	import { Badge, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { writable } from 'svelte/store';
	import { slide } from 'svelte/transition';
	import PartInfo from '../PartInfo.svelte';
	import UserIcon from '../UserIcon.svelte';
	import NewComponent from './NewComponent.svelte';
	import Viewer, { getComponentGroup, getComponentGroups } from '../Viewer.svelte';

	let items = [];

	let lines = new Map();
	$: {
		if (bom?.lines) {
			bom.lines.forEach((line) => {
				//console.log(line);
				let part = line?.part || null;
				if (!lines.has(part)) {
					lines.set(part, []);
				}
				lines.get(part).push(line);
			});
			items = lines.keys();
		}
		console.log(lines);
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

	function qtyColor(qty: number, requiredQty: number) {
		if (qty === requiredQty) return 'blue';
		if (qty < requiredQty) return 'red';
		if (qty > requiredQty) return 'green';
	}

	let highlightComponents: string[] = [];

	function highlightReferences(references: string[], highlight: boolean = true) {
		references.forEach((r) => {
			let group = getComponentGroups(r);
			console.log('highlightReferences', r, group);
			group = group?.[0];
			if (group) {
				group.find(`.outline`).forEach((c) => {
					//console.log('Update component colour:', c);
					c.fillEnabled(true);
					c.fill(highlight ? 'blue' : '');
					c.opacity(0.75);
				});
			}
		});
	}

	function handleReferenceHover(references: string[], hovering: boolean) {
		console.log('handleReferenceHover', references, hovering);
		highlightReferences(references, hovering);
	}

	$: console.log('BOM:', bom);
	$: console.log('partsInLibrary:', partsInLibrary, partsInLibrary.length);
	$: console.log('cad:', job?.assembly?.assemblies_cad);
</script>

{#if bom}
	<Table hoverable={true}>
		<TableHead>
			<TableHeadCell on:click={() => sortTable('id')}>#</TableHeadCell>
			<TableHeadCell on:click={() => sortTable('maker')}>Part</TableHeadCell>
			<TableHeadCell>Description</TableHeadCell>
			<TableHeadCell on:click={() => sortTable('type')}>References</TableHeadCell>
			<TableHeadCell on:click={() => sortTable('make')}>Qty</TableHeadCell>
			{#if job?.quantity}
				<TableHeadCell>Build Qty</TableHeadCell>
			{/if}
			{#if job?.kit?.kits_items}
				<TableHeadCell>Kit Qty</TableHeadCell>
				<TableHeadCell>Kit Attrition</TableHeadCell>
			{/if}
		</TableHead>
		<TableBody class="divide-y">
			{#each lines.keys() as lineKey, idx}
				{@const line = lines.get(lineKey)}
				{@const references = line?.map((l) => l?.reference) || []}
				{@const kitItem = job?.kit?.kits_items?.filter((i) => i.part_id === lineKey)}
				{@const buildQty = lineKey ? references?.length * job?.quantity : 0}
				<TableBodyRow
					class={`cursor-pointer`}
					on:click={() => {
						console.log('line click', lineKey, line);
						highlightComponents = references;
						handleReferenceHover(references, true);
						//if (!lineKey) return;
						openRow = openRow === idx ? null : idx;
					}}
				>
					<TableBodyCell>{idx + 1}</TableBodyCell>
					<TableBodyCell class={`${partsInLibrary.length > 0 && partsInLibrary.includes(lineKey) ? 'underline' : ''}`}
						>{lineKey || 'Not Fitted'}</TableBodyCell
					>
					<TableBodyCell>{line?.[0]?.partByPart?.description || ''}</TableBodyCell>
					<TableBodyCell>
						{#each references as reference}
							<span
								on:mouseenter={() => {
									handleReferenceHover([reference], true);
								}}
								on:mouseleave={() => {
									handleReferenceHover(references, false);
								}}
							>
								<Badge class="mx-0.5" color={lineKey ? 'blue' : 'red'}>{reference}</Badge>
							</span>
						{/each}
					</TableBodyCell>
					<TableBodyCell>{references?.length}</TableBodyCell>
					{#if job?.quantity}
						<TableBodyCell>{buildQty}</TableBodyCell>
					{/if}

					{#if job?.kit?.kits_items}
						{@const kitItemQty = kitItem?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}
						{@const kitItemAttritionPercentage = ((kitItemQty - buildQty) / buildQty) * 100 || 0}
						<TableBodyCell>
							<Badge class="mx-0.5" color={!lineKey ? 'blue' : qtyColor(kitItemQty, buildQty)}>
								{kitItemQty}
							</Badge>
						</TableBodyCell>
						<TableBodyCell>
							<Badge class="mx-0.5" color={!lineKey ? 'blue' : qtyColor(kitItemQty, buildQty)}>
								{kitItemQty - buildQty} ({Math.round(kitItemAttritionPercentage)}%)
							</Badge>
						</TableBodyCell>
					{/if}
				</TableBodyRow>
				{#if openRow === idx}
					<TableBodyRow class="h-24">
						<TableBodyCell colspan="3" class="p-0">
							<div class="px-1 py-1">
								{#if partsInLibrary.length > 0 && !partsInLibrary.includes(lineKey)}
									<NewComponent id={lineKey} description={line?.[0]?.description} />
								{:else}
									<PartInfo partId={lineKey} kbVisible />
								{/if}
							</div>
						</TableBodyCell>
						<TableBodyCell colspan="2" class="p-0">
							<div class="px-0 py-1 grid grid-cols-2">
								<Viewer classes="border" data={job?.assembly?.assemblies_cad} id="TOP" layerToShow="TOP" height={500} />
								<Viewer
									classes="border"
									data={job?.assembly?.assemblies_cad}
									id="BOTTOM"
									layerToShow="BOTTOM"
									height={500}
								/>
							</div>
						</TableBodyCell>
						{#if job?.kit?.kits_items}
							<TableBodyCell colspan="3" class="p-0 object-right">
								<div class="px-1 py-1">
									{#each kitItem as item, idx}
										<div class="flex bg-gray-400 rounded-lg p-1 px-2 m-1 align-middle">
											<UserIcon user={item?.user} />
											<p class="text-lg mx-1 text-white items-center">
												({item.quantity}) [{item?.orders_item?.order?.supplier?.name
													? `${item?.orders_item?.order?.supplier?.name}:${item?.orders_item?.order?.reference}`
													: 'Unknown Supplier'}]
											</p>
										</div>
									{/each}
								</div>
							</TableBodyCell>
						{/if}
					</TableBodyRow>
				{/if}
			{/each}
		</TableBody>
	</Table>
{/if}
