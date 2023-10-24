<script lang="ts">
	export let bom;
	export let job = {};
	export let partsInLibrary: string[] = [];
	import { mediaQuery } from 'svelte-legos';
	import { Badge, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip } from 'flowbite-svelte';
	import { writable } from 'svelte/store';
	import PartInfo from '../PartInfo.svelte';
	import UserIcon from '../UserIcon.svelte';
	import NewComponent from './NewComponent.svelte';
	import Viewer, { getComponentGroups } from '../Viewer.svelte';
	import BomTableLine from './BomTableLine.svelte';
	import { datetimeFormat } from '$lib/utils';
	import { fade } from 'svelte/transition';

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
	let highlightedReferences: string[] = [];
	let openRows: number[] = [];

	function qtyColor(qty: number, requiredQty: number) {
		if (qty === requiredQty) return 'blue';
		if (qty < requiredQty) return 'red';
		if (qty > requiredQty) return 'green';
	}

	function highlightReferences(references: string[], highlight: boolean = true) {
		if (highlight) {
			highlightedReferences = highlightedReferences.concat(references);
		} else {
			highlightedReferences = highlightedReferences.filter((v) => !highlightedReferences.includes(v));
		}
		console.log('highlightedReferences', highlightedReferences);
		references.forEach((r) => {
			let group = getComponentGroups(r);
			group = group?.[0];
			if (group) {
				group?.find('.outline')?.forEach((c) => {
					//console.log('Update component colour:', c);
					c.fillEnabled(true);
					c.fill(highlight ? 'blue' : '');
					c.opacity(0.75);
				});
			}
		});
	}

	function handleReferenceHover(references: string[], hovering: boolean) {
		//console.log('handleReferenceHover', references, hovering);
		if (hovering) {
			highlightedReferences = highlightedReferences.concat(references);
		} else {
			highlightedReferences = highlightedReferences.filter((v) => !highlightedReferences.includes(v));
		}
		console.log('handleReferenceHover', highlightedReferences);
		//highlightReferences(references, hovering);
	}

	function handleRowClick(idx: number, references: string[], line, pn: string | null, event: MouseEvent) {
		console.log('handleRowClick', idx, references, line, event);
		if (!pn) return;
		if (openRows.includes(idx)) {
			openRows = openRows.filter((v) => v !== idx);
			handleReferenceHover(references, false);
		} else {
			openRows = event.detail.ctrlKey ? [...openRows, idx] : [idx];
			handleReferenceHover(references, true);
		}
	}

	$: console.log('BOM:', bom);
	$: console.log('partsInLibrary:', partsInLibrary, partsInLibrary.length);
	$: console.log('cad:', job?.assembly?.assemblies_cad);
</script>

{#if bom}
	<Table shadow>
		<TableHead theadClass="bg-slate-300">
			<TableHeadCell colspan="5">{bom?.name}({bom?.revision_external}:{bom?.revision_internal})</TableHeadCell>
			{#if job?.id}
				<TableHeadCell>Job</TableHeadCell>
			{/if}

			{#if job?.orders_items}
				<TableHeadCell colspan="3">Order</TableHeadCell>
			{/if}
		</TableHead>
		<TableHead theadClass="bg-slate-200">
			<TableHeadCell>#</TableHeadCell>
			<TableHeadCell>Part</TableHeadCell>
			<TableHeadCell>Description</TableHeadCell>
			<TableHeadCell>References</TableHeadCell>
			<TableHeadCell>Qty</TableHeadCell>
			{#if job?.quantity}
				<TableHeadCell>Qty</TableHeadCell>
			{/if}
			{#if job?.orders_items}
				<TableHeadCell>Supplier</TableHeadCell>
				<TableHeadCell>Qty</TableHeadCell>
				<TableHeadCell>Attrition</TableHeadCell>
			{/if}
		</TableHead>
		<TableBody>
			{#each lines.keys() as lineKey, idx}
				{@const line = lines.get(lineKey)}
				{@const references = line?.map((l) => l?.reference) || []}
				{@const kitItem = job?.kit?.kits_items?.filter((i) => i.part_id === lineKey)}
				{@const orderItems = job?.orders_items?.filter((i) => i.part_id === lineKey)}
				{@const buildQty = lineKey ? references?.length * job?.quantity : 0}
				{@const description = line?.[0]?.partByPart?.description}
				{@const inLibrary = partsInLibrary.length > 0 && partsInLibrary.includes(lineKey)}
				<BomTableLine
					pn={lineKey}
					rowIndex={idx}
					{description}
					{buildQty}
					{references}
					{inLibrary}
					{orderItems}
					highlighted={openRows.includes(idx)}
					on:click={(e) => {
						handleRowClick(idx, references, line, lineKey, e);
					}}
				/>
				<!-- {#if openRow === idx} -->
				{#if openRows.includes(idx)}
					<TableBodyRow class="h-24 shadow-inner">
						<TableBodyCell colspan="5" class="p-0">
							<div class="px-1 py-1">
								{#if inLibrary}
									<NewComponent id={lineKey} {description} />
								{:else}
									<PartInfo partId={lineKey} galleryVisible />
								{/if}
							</div>
						</TableBodyCell>
						{#if orderItems?.length > 0}
							<TableBodyCell colspan="4" class="p-0 object-right">
								<div class="px-1 py-1">
									<h1>Orders:</h1>
									<Table>
										<TableHead>
											<TableHeadCell padding="px-1 py-1">User</TableHeadCell>
											<!-- <TableHeadCell padding="px-1 py-1">Time/Date</TableHeadCell> -->
											<TableHeadCell padding="px-1 py-1">Reference</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">Supplier</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">Qty</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">Cost</TableHeadCell>
										</TableHead>
										<TableBody>
											{#each orderItems as item, idx}
												<TableBodyRow>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														<UserIcon size="xs" user={item?.user}>
															{#if mediaQuery('(min-width: 1024px)')}
																{item?.user?.username}
															{/if}
														</UserIcon>
														<Tooltip placement="right">
															{datetimeFormat(item.created_at)}
														</Tooltip>
													</TableBodyCell>
													<!-- <TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														<p>{new Date(item.created_at).toLocaleDateString()}</p>
														<p>{new Date(item.created_at).toLocaleTimeString()}</p>
													</TableBodyCell> -->
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{item?.order?.supplier?.reference || ''}
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{item?.order?.supplier?.name || 'Unknown'}
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{item?.quantity}
													</TableBodyCell>

													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{new Intl.NumberFormat('en-GB', {
															style: 'currency',
															currency: 'GBP'
														}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
													</TableBodyCell>
												</TableBodyRow>
												<!-- <div class="flex bg-gray-400 rounded-lg p-1 px-2 m-1">
											<UserIcon user={item?.user} />
											<p class="text-lg text-white items-center align-middle mx-auto">
												({item.quantity}) [{item?.orders_item?.order?.supplier?.name
													? `${item?.orders_item?.order?.supplier?.name}:${item?.orders_item?.order?.reference}`
													: 'Unknown Supplier'}]
											</p>
										</div> -->
											{/each}
										</TableBody>
										<tfoot class="rounded-sm text-xs">
											<tr class="font-semibold text-gray-900 dark:text-white dark:bg-gray-500 bg-gray-100">
												<td />
												<td />
												<td />
												<!-- <td /> -->
												<td>
													{orderItems?.reduce((a, v) => a + v.quantity, 0)}
												</td>
												<td>
													{new Intl.NumberFormat('en-GB', {
														style: 'currency',
														currency: 'GBP'
													}).format(orderItems?.reduce((a, v) => a + v.price * v.quantity, 0))}
												</td>
											</tr>
										</tfoot>
									</Table>
								</div>
							</TableBodyCell>
						{:else}
							<TableBodyCell colspan="3" class="p-0 object-right" />
						{/if}
					</TableBodyRow>
				{/if}
			{/each}
		</TableBody>
	</Table>
{/if}
