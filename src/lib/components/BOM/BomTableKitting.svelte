<script lang="ts">
	export let bom;
	export let job = {};
	export let partsInLibrary: string[] = [];
	export let visibleColumns: string[] = [
		'part',
		'description',
		'references',
		'quantity',
		'build_quantity',
		'order_quantity',
		'received_quantity',
		'kit_button'
	];

	import {
		Accordion,
		AccordionItem,
		Badge,
		Modal,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import PartInfo from '../PartInfo.svelte';
	import NewComponent from './NewComponent.svelte';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { getSelectionText } from '$lib/utils';
	import BomTableLineReferences from './BomTableLineReferences.svelte';
	import KitItem from '../Kitting/KitItem.svelte';
	import { PlusOutline, ShoppingCartSolid } from 'flowbite-svelte-icons';
	import TableHeadCollapsible from '../Misc/Table/TableHeadCollapsible.svelte';
	import TableBodyCollapsible from '../Misc/Table/TableBodyCollapsible.svelte';
	import { XMark } from 'svelte-heros-v2';
	import { messagesStore, storage } from 'svelte-legos';
	import { writable } from 'svelte/store';
	import { scanStore } from '$lib/stores';
	import KitItemsTable from '../Kitting/KitItemsTable.svelte';
	import ReceiptItemsTable from '../Kitting/ReceiptItemsTable.svelte';
	import OrderItemsTable from '../Kitting/OrderItemsTable.svelte';

	let items = [];

	let lines = new Map();
	/* $: {
		if (bom?.lines) { */
	bom.lines.forEach((line) => {
		//console.log(line);
		let part = line?.part || null;
		if (!lines.has(part)) {
			lines.set(part, []);
		}
		lines.get(part).push(line);
	});
	items = lines.keys();
	/* } */
	console.log(lines);
	/* } */

	let highlightedReferences: string[] = [];
	let openRows: number[] = [];

	function qtyColor(qty: number, requiredQty: number) {
		if (qty === requiredQty) return 'green';
		if (qty < requiredQty) return 'red';
		if (qty > requiredQty) return 'green';
	}

	const dispatch = createEventDispatcher();

	function handleRowClick(idx: number, references: string[], line, pn: string | null, event: MouseEvent) {
		console.log('handleRowClick', idx, references, line, event);
		dispatch('row_click', { idx, references, line, event });
		if (!pn) return;
		if (getSelectionText()) return;
		if (openRows.includes(idx)) {
			openRows = openRows.filter((v) => v !== idx);
			//handleReferenceHover(references, false);
		} else {
			openRows = event.ctrlKey ? [...openRows, idx] : [idx];
			//handleReferenceHover(references, true);
		}
	}

	$: console.log('BOM:', bom);
	$: console.log('JOB:', job);
	$: console.log('activeLine', activeLine);

	let receiveModal = false;
	let activeLine = {};

	let collapsedColumns = storage(writable([]), 'EAMES_kitting_collapsedColumns');
	let scanStoreUnsub = scanStore.subscribe((scan: string) => {
		if (!scan) return;
		console.log('scanStore3', scan);
		let r = scan?.toLowerCase()?.match(/(?<CON>(06k).*)(?<MPN>(p1p).*)(?<SPN>(3p).*)(?<QTY>(q).*)(?<UNDEFINED>(9d).*)/);
		console.log('scanPartTokens', scan, scan?.toLowerCase(), r?.groups);
		//TODO: Fix regex not to include prefixes in capture groups...
		let scanPartTokens = {
			spn: r?.groups?.SPN?.slice(2),
			mpn: r?.groups?.MPN?.slice(3),
			qty: Number(r?.groups?.QTY?.slice(1)),
			con: r?.groups?.CON?.slice(3)
		};
		console.log('scanPartTokens', scanPartTokens);
		scanStore.set('');
		if (scanPartTokens?.mpn) {
			messagesStore(`Part scanned: ${scanPartTokens.mpn}`);
			setActiveLine(scanPartTokens.mpn, scanPartTokens.con, scanPartTokens.qty);
		}
	});
	onDestroy(scanStoreUnsub);

	function setActiveLine(mpn: string, con, qty): boolean {
		let matches = [...lines.entries()].filter(([key, value], idx) => {
			let found = key?.toLowerCase() === mpn.toLowerCase();
			if (found) {
				messagesStore(`Part found on line: ${idx + 1}`, 'success');
			}
			return found;
		});
		console.log('setActiveLine', matches);
		if (matches.length === 1) {
			let match = matches?.[0];
			const kitItems = job?.jobs_kits
				?.map((jk) => jk.kit?.kits_items?.filter((i) => i.part_id?.toLowerCase() === mpn || i.part?.toLowerCase() === mpn))
				.flat();
			const orderItems = job?.jobs_orders
				?.map((jo) =>
					jo.order?.orders_items?.filter((i) => i.part_id?.toLowerCase() === mpn || i.part?.toLowerCase() === mpn)
				)
				.flat();

			if (con) {
				console.log('setActiveLine', 'has con', con);
				orderItems.forEach((i) => {
					const idString = i.order.id.toString();
					console.log('setActiveLine', 'con', idString, i.order.id, con);
					if (idString === con || i.order.id === con) {
						console.log('setActiveLine', 'con match', i);
						i.__selected = true;
						if (qty && qty > 0) {
							console.log('setActiveLine', 'con has qty', qty, i.quantity);
							if (qty <= i.quantity) {
								i.__quantity = qty;
							} else {
								console.error('setActiveLine', 'scan qty higher than line order qty!', qty, i?.quantity);
							}
						}
						return;
					}
				});
			}

			activeLine.line = match?.[1];
			activeLine.kitItems = kitItems;
			activeLine.orderItems = orderItems;

			receiveModal = true;

			return true;
		} else if (matches.length > 1) {
			console.log('setActiveLineFromMPN', 'multiple matches for', mpn);
		} else {
			console.log('setActiveLineFromMPN', 'no matches for', mpn);
		}
		return false;
	}

	function rowColor(
		pn: string | null,
		buildQty: number = 0,
		orderQty: number = 0,
		receivedQty: number = 0,
		kittedQty: number = 0
	) {
		if (!pn) return 'default';

		if (kittedQty > 0 && kittedQty < buildQty) {
			return 'red';
		} else if (kittedQty > 0 && kittedQty < orderQty) {
			return 'yellow';
		} else if (kittedQty >= buildQty) {
			return 'green';
		} else {
			return 'default';
		}

		/* {
			!lineKey
				? 'default'
				: kittedQty > 0 && kittedQty < orderItemQty
				? 'yellow'
				: kittedQty >= buildQty
				? 'green'
				: 'default';
		} */
	}

	let partSearch = '';
	let descriptionSearch = '';
	let supplierSearch = '';
	$: ordersSuppliers = job?.jobs_orders?.flatMap((jo) => jo.order?.supplier?.name)?.filter((v, i, a) => a.indexOf(v) === i);
	$: console.log('ordersSuppliers', ordersSuppliers, supplierSearch);
</script>

<Modal outsideclose bind:open={receiveModal} size="lg">
	<KitItem
		{job}
		kits={job?.jobs_kits?.map((jk) => jk.kit)}
		orderItems={activeLine?.orderItems}
		kitItems={activeLine?.kitItems}
		pn={activeLine?.line?.[0]?.part}
		part={activeLine?.line?.[0]?.partByPart}
		bomLine={activeLine?.line}
		bind:visible={receiveModal}
	/>
</Modal>

{#if bom}
	<Table hoverable shadow>
		<TableHead>
			<TableHeadCell />

			<TableHeadCollapsible
				columnId="part"
				visible={visibleColumns?.includes('part')}
				bind:collapsedColumns={$collapsedColumns}
				showCollapseButton={false}
			>
				<input
					class="m-0 block text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
					type="text"
					bind:value={partSearch}
				/>
				<div class="flex my-auto hover:text-red-600" on:click={() => (partSearch = '')}>
					<XMark size="16" />
				</div>
			</TableHeadCollapsible>

			<TableHeadCollapsible
				columnId="description"
				visible={visibleColumns?.includes('description')}
				bind:collapsedColumns={$collapsedColumns}
				showCollapseButton={false}
			>
				<input
					class="block text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
					type="text"
					bind:value={descriptionSearch}
				/>
				<div class="flex my-auto hover:text-red-600" on:click={() => (descriptionSearch = '')}>
					<XMark size="16" />
				</div>
			</TableHeadCollapsible>
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell>
				{#if ordersSuppliers?.[0]}
					<select
						class="w-fit block text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded py-0.5 px-0"
						bind:value={supplierSearch}
					>
						<option value={''} />
						{#each ordersSuppliers as supplierName}
							<option value={supplierName}>
								{supplierName}
							</option>
						{/each}
					</select>
				{/if}
			</TableHeadCell>
			<TableHeadCell padding="px-6 py-1" colspan="4">
				<p class="float-right">{bom?.name}({bom?.revision_external}:{bom?.revision_internal})</p>
			</TableHeadCell>
		</TableHead>
		<TableHead>
			<TableHeadCell>#</TableHeadCell>
			<TableHeadCollapsible
				columnId="part"
				visible={visibleColumns?.includes('part')}
				bind:collapsedColumns={$collapsedColumns}
			>
				Part
			</TableHeadCollapsible>
			<TableHeadCollapsible
				columnId="description"
				visible={visibleColumns?.includes('description')}
				bind:collapsedColumns={$collapsedColumns}
			>
				Description
			</TableHeadCollapsible>
			<TableHeadCollapsible
				columnId="references"
				visible={visibleColumns?.includes('references')}
				bind:collapsedColumns={$collapsedColumns}
			>
				References
			</TableHeadCollapsible>
			{#if visibleColumns?.includes('quantity')}
				<TableHeadCell>Qty</TableHeadCell>
			{/if}
			{#if job?.quantity && visibleColumns?.includes('build_quantity')}
				<TableHeadCell>Build Qty</TableHeadCell>
			{/if}
			{#if job?.jobs_orders && visibleColumns?.includes('order_quantity')}
				<TableHeadCell>Order Qty</TableHeadCell>
			{/if}
			{#if job?.jobs_orders && visibleColumns?.includes('received_quantity')}
				<TableHeadCell>Received Qty</TableHeadCell>
			{/if}
			{#if job?.jobs_kits}
				<TableHeadCell>Kit Qty</TableHeadCell>
				<TableHeadCell>Kit Attrition</TableHeadCell>
			{/if}
			{#if visibleColumns?.includes('kit_button')}
				<TableHeadCell />
			{/if}
		</TableHead>
		<TableBody>
			{#each lines.keys() as lineKey, idx}
				{@const line = lines.get(lineKey)}
				{@const references = line?.map((l) => l?.reference) || []}
				{@const kitItems = job?.jobs_kits
					?.map((jk) => jk.kit?.kits_items?.filter((i) => i.part_id === lineKey || i.part === lineKey))
					.flat()}
				{@const orderItems = lineKey
					? job?.jobs_orders
							?.map((jo) => jo.order?.orders_items?.filter((i) => i.part_id === lineKey || i.part === lineKey))
							.flat()
					: []}
				{@const lineSuppliers = orderItems?.flatMap((oi) => oi?.order?.supplier?.name)}
				{@const orderItemQty = orderItems?.reduce((a, v) => a + v.quantity, 0)}
				{@const receiptItems = orderItems?.map((i) => i.orders_items_receiveds)?.flat()}
				{@const receivedItemQty = receiptItems?.reduce((a, v) => a + v.quantity, 0)}
				{@const buildQty = lineKey ? references?.length * job?.quantity : 0}
				{@const description = line?.[0]?.partByPart?.description}
				{@const kittedQty = kitItems?.reduce((a, v) => a + v.quantity, 0)}
				{#if lineKey?.toLowerCase().includes(partSearch.toLowerCase()) && (descriptionSearch == '' || description
							?.toLowerCase()
							.includes(descriptionSearch.toLowerCase()) || line?.[0]?.description
							?.toLowerCase()
							.includes(descriptionSearch.toLowerCase())) && (supplierSearch == '' || lineSuppliers?.includes(supplierSearch))}
					<TableBodyRow
						color={rowColor(lineKey, buildQty, orderItemQty, receivedItemQty, kittedQty)}
						class={`cursor-pointer`}
						on:click={(e) => {
							handleRowClick(idx, references, line, lineKey, e);
						}}
					>
						<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">{idx + 1}</TableBodyCell>

						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="part"
							visible={visibleColumns?.includes('part')}
							bind:collapsedColumns={$collapsedColumns}
						>
							<p
								class={`${partsInLibrary.length > 0 && partsInLibrary?.includes(lineKey) ? 'underline' : ''} ${
									activeLine?.line?.[0]?.part === lineKey ? 'bg-blue-400 p-1 rounded-sm' : ''
								}`}
							>
								{lineKey || 'Not Fitted'}
							</p>
						</TableBodyCollapsible>

						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="description"
							visible={visibleColumns?.includes('description')}
							bind:collapsedColumns={$collapsedColumns}
						>
							<div class="max-w-lg scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 overflow-x-auto">
								<p class="overflow-hidden text-clip">{description || ''}</p>
								{#if line?.[0]?.description && line?.[0]?.description !== description}
									<p class=" text-clip italic text-xs">{line?.[0]?.description}</p>
								{/if}
							</div>
						</TableBodyCollapsible>

						<TableBodyCollapsible
							tdClass="px-6 py-1 whitespace-nowrap font-medium"
							columnId="references"
							visible={visibleColumns?.includes('references')}
							bind:collapsedColumns={$collapsedColumns}
						>
							<BomTableLineReferences pn={lineKey} {references} />
						</TableBodyCollapsible>

						{#if visibleColumns?.includes('quantity')}
							<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">{references?.length}</TableBodyCell>
						{/if}

						{#if job?.quantity && visibleColumns?.includes('build_quantity')}
							<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">{buildQty}</TableBodyCell>
						{/if}

						{#if job?.jobs_orders && visibleColumns?.includes('order_quantity')}
							<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">
								<div class="grid grid-cols-1 gap-y-1">
									{#each orderItems as orderItem}
										<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(orderItemQty, buildQty)}>
											{orderItem?.quantity} | {orderItem?.order?.supplier?.name}
										</Badge>
									{:else}
										<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(orderItemQty, buildQty)}>0</Badge>
									{/each}
								</div>
								<!-- <Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(orderItemQty, buildQty)}>
									{orderItemQty}
								</Badge> -->
							</TableBodyCell>
						{/if}

						{#if job?.jobs_orders && visibleColumns?.includes('received_quantity')}
							<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">
								<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(receivedItemQty, orderItemQty)}>
									{receivedItemQty}
								</Badge>
							</TableBodyCell>
						{/if}

						{#if job?.jobs_kits}
							{@const kitItemQty = kitItems?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}
							{@const kitItemAttritionPercentage = ((kitItemQty - buildQty) / buildQty) * 100 || 0}
							<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">
								<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(kitItemQty, buildQty)}>
									{kitItemQty}
								</Badge>
							</TableBodyCell>
							<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">
								<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(kitItemQty, buildQty)}>
									{kitItemQty - buildQty} ({Math.round(kitItemAttritionPercentage)}%)
								</Badge>
							</TableBodyCell>
						{/if}
						{#if visibleColumns?.includes('kit_button')}
							<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">
								<div
									class="cursor-pointer w-fit"
									on:click|stopPropagation={(e) => {
										activeLine = { line, orderItems, kitItems };
										receiveModal = true;
										console.log('activeLine', activeLine);
										e.preventDefault();
									}}
								>
									<PlusOutline size="lg" />
								</div>
							</TableBodyCell>
						{/if}
					</TableBodyRow>
					{#if openRows?.includes(idx)}
						<TableBodyRow class="h-24">
							<TableBodyCell colspan="3" class="p-0">
								<div class="px-1 py-1">
									{#if partsInLibrary.length > 0 && !partsInLibrary?.includes(lineKey)}
										<NewComponent id={lineKey} {description} />
									{:else}
										<PartInfo partId={lineKey} galleryVisible showFootprint />
									{/if}
								</div>
							</TableBodyCell>
							<TableBodyCell colspan="3" />
							<TableBodyCell colspan="5" class="p-0 object-right">
								<div class="px-1 py-0">
									<Accordion multiple>
										<AccordionItem paddingDefault="p-1" open={receivedItemQty === 0 && kittedQty === 0}>
											<span slot="header" class="text-base flex gap-2">
												<ShoppingCartSolid
													class={`mt-0.5 ${orderItemQty >= buildQty ? 'text-green-500' : 'text-red-500'}`}
												/>
												<span>Order</span>
											</span>
											<OrderItemsTable {orderItems} />
										</AccordionItem>
										<AccordionItem paddingDefault="p-1" open={receivedItemQty > 0 && kittedQty < 1}>
											<span slot="header" class="text-base flex gap-2">
												{#if receivedItemQty === 0}
													<img
														style="filter: brightness(0) saturate(10%) invert(30%) sepia(97%) saturate(600%) hue-rotate(350deg)"
														width="24"
														height="24"
														src="https://img.icons8.com/ios/50/unpacking.png"
														alt="unpacking"
													/>
												{:else if receivedItemQty >= orderItemQty}
													<img
														style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
														width="24"
														height="24"
														src="https://img.icons8.com/ios/50/unpacking.png"
														alt="unpacking"
													/>
												{:else}
													<img
														style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(350deg)"
														width="24"
														height="24"
														src="https://img.icons8.com/ios/50/unpacking.png"
														alt="unpacking"
													/>
												{/if}
												<span>Receipt</span>
											</span>
											<ReceiptItemsTable {receiptItems} />
										</AccordionItem>
										<AccordionItem paddingDefault="p-1" open={kittedQty > 0}>
											<span slot="header" class="text-base flex gap-2">
												{#if kittedQty === 0}
													<img
														style="filter: brightness(0) saturate(10%) invert(30%) sepia(97%) saturate(600%) hue-rotate(350deg)"
														width="24"
														height="24"
														src="https://img.icons8.com/ios/50/packing.png"
														alt="packing"
													/>
												{:else if kittedQty >= orderItemQty}
													<img
														style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
														width="24"
														height="24"
														src="https://img.icons8.com/ios/50/packing.png"
														alt="packing"
													/>
												{:else}
													<img
														style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(350deg)"
														width="24"
														height="24"
														src="https://img.icons8.com/ios/50/packing.png"
														alt="packing"
													/>
												{/if}
												<span>Kitting</span>
											</span>
											<KitItemsTable {kitItems} jobsKits={job?.jobs_kits} />
										</AccordionItem>
									</Accordion>
								</div>
							</TableBodyCell>
						</TableBodyRow>
					{/if}
				{/if}
			{/each}
		</TableBody>
	</Table>
{/if}
