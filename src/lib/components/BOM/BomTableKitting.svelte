<script lang="ts">
	import { page } from '$app/stores';
	export let bom;
	export let job = {};
	export let allocations = [];
	export let jobs_kits = [];
	export let partsInLibrary: string[] = [];
	export let visibleColumns: string[] = [
		'part',
		'type',
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
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import PartInfo from '../PartInfo.svelte';
	import NewComponent from './NewComponent.svelte';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { getSelectionText } from '$lib/utils';
	import BomTableLineReferences from './BomTableLineReferences.svelte';
	import KitItem from '../Kitting/KitItem.svelte';
	import { DotsHorizontalOutline, PlusOutline, ShoppingCartSolid } from 'flowbite-svelte-icons';
	import TableHeadCollapsible from '../Misc/Table/TableHeadCollapsible.svelte';
	import TableBodyCollapsible from '../Misc/Table/TableBodyCollapsible.svelte';
	import { XMark } from 'svelte-heros-v2';
	import { messagesStore, storage } from 'svelte-legos';
	import { writable } from 'svelte/store';
	import { scanStore } from '$lib/stores';
	import KitItemsTable from '../Kitting/KitItemsTable.svelte';
	import ReceiptItemsTable from '../Kitting/ReceiptItemsTable.svelte';
	import OrderItemsTable from '../Kitting/OrderItemsTable.svelte';

	//let items = [];

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
	//items = lines.keys();
	/* } */
	console.log(lines);
	/* } */

	let highlightedReferences: string[] = [];
	let openRows: number[] = [];

	function qtyColor(qty: number, requiredQty: number, kittedQtyIndeterminate: boolean = false) {
		if (kittedQtyIndeterminate) return 'purple';
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
		pn: string | null | undefined,
		buildQty: number = 0,
		orderQty: number = 0,
		receivedQty: number = 0,
		kittedQty: number = 0,
		kittedQtyIndeterminate: boolean = false
	): 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'default' | 'custom' | undefined {
		if (!pn) return 'yellow';
		if (kittedQtyIndeterminate) return 'purple';
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
	let mountTypeSearch = '';
	$: ordersSuppliers = allocations
		?.flatMap((a) => a?.orders_item?.order?.supplier?.name)
		?.filter((v, i, a) => a.indexOf(v) === i)
		?.sort();
	$: mountTypes = bom?.lines
		?.filter((l) => l?.part)
		?.flatMap((l) => l?.partByPart?.properties?.type)
		?.filter((v, i, a) => a.indexOf(v) === i)
		?.sort();
	$: console.log('mountTypes', mountTypes);
	$: console.log('ordersSuppliers', ordersSuppliers, supplierSearch);
	$: console.log('allocations', allocations);
	let collapseReferences = storage(writable(false), 'EAMES_kitting_collapseReferences');
</script>

<Modal outsideclose bind:open={receiveModal} size="lg" title={activeLine?.line?.[0]?.part}>
	<KitItem
		{job}
		jobKits={jobs_kits}
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
			<TableHeadCell padding="px-2 py-3" />
			<TableHeadCollapsible
				padding="px-2 py-3"
				columnId="type"
				visible={visibleColumns?.includes('type')}
				bind:collapsedColumns={$collapsedColumns}
				showCollapseButton={false}
			>
				{#if mountTypes?.length > 0}
					<select
						class=" text-xs border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded py-0.5 px-0"
						bind:value={mountTypeSearch}
					>
						<option value={''} />
						{#each mountTypes as mountType}
							<option value={mountType}>
								{mountType || '???'}
							</option>
						{/each}
					</select>
				{/if}
			</TableHeadCollapsible>
			<TableHeadCollapsible
				padding="px-2 py-3"
				columnId="part"
				visible={visibleColumns?.includes('part')}
				bind:collapsedColumns={$collapsedColumns}
				showCollapseButton={false}
			>
				<input
					class="m-0 block text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
					type="text"
					list="part_numbers"
					bind:value={partSearch}
				/>
				<datalist id="part_numbers">
					{#each lines.keys() as part}
						<option value={part} />
					{/each}
				</datalist>
				<div class="flex my-auto hover:text-red-600" on:click={() => (partSearch = '')}>
					<XMark size="16" />
				</div>
			</TableHeadCollapsible>
			<TableHeadCollapsible
				padding="px-2 py-3"
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
			<TableHeadCell padding="px-2 py-3" />
			<TableHeadCell padding="px-2 py-3" />
			<TableHeadCell padding="px-2 py-3" />
			<TableHeadCell padding="px-2 py-3">
				{#if ordersSuppliers?.length > 0}
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
			<TableHeadCell padding="pl-3 px-2 py-3">#</TableHeadCell>
			<TableHeadCollapsible
				padding="px-2 py-3"
				columnId="type"
				visible={visibleColumns?.includes('type')}
				bind:collapsedColumns={$collapsedColumns}
			>
				Type
			</TableHeadCollapsible>
			<TableHeadCollapsible
				padding="px-2 py-3"
				columnId="part"
				visible={visibleColumns?.includes('part')}
				bind:collapsedColumns={$collapsedColumns}
			>
				Part
			</TableHeadCollapsible>
			<TableHeadCollapsible
				padding="px-2 py-3"
				columnId="description"
				visible={visibleColumns?.includes('description')}
				bind:collapsedColumns={$collapsedColumns}
			>
				Description
			</TableHeadCollapsible>
			<TableHeadCollapsible
				padding="px-2 py-3"
				columnId="references"
				visible={visibleColumns?.includes('references')}
				bind:collapsedColumns={$collapsedColumns}
			>
				References
				<span
					class="my-auto px-2 focus:outline-none"
					on:click={() => {
						$collapseReferences = !$collapseReferences;
					}}
				>
					<DotsHorizontalOutline size="xs" />
				</span>
			</TableHeadCollapsible>
			{#if visibleColumns?.includes('quantity')}
				<TableHeadCell padding="px-2 py-3">Qty</TableHeadCell>
			{/if}
			{#if job?.quantity && visibleColumns?.includes('build_quantity')}
				<TableHeadCell padding="px-2 py-3">Build Qty</TableHeadCell>
			{/if}
			{#if allocations && visibleColumns?.includes('order_quantity')}
				<TableHeadCell padding="px-2 py-3">Order Qty</TableHeadCell>
			{/if}
			{#if allocations && visibleColumns?.includes('received_quantity')}
				<TableHeadCell padding="px-2 py-3">Received Qty</TableHeadCell>
			{/if}
			{#if job?.jobs_kits}
				<TableHeadCell padding="px-2 py-3">Kit Qty</TableHeadCell>
				<TableHeadCell padding="px-2 py-3">Kit Attrition</TableHeadCell>
			{/if}
			{#if visibleColumns?.includes('kit_button') && $page?.data?.user}
				<TableHeadCell />
			{/if}
		</TableHead>
		<TableBody>
			{#each lines.keys() as lineKey, idx}
				{@const line = lines.get(lineKey)}
				{@const part = line?.[0]?.partByPart}
				{@const references = line?.map((l) => l?.reference) || []}
				{@const lineQty = line?.reduce((a, l) => a + (l?.quantity || 1), 0) + (line?.quantity || 0)}
				{@const kitItems = job?.jobs_kits
					?.map((jk) => jk.kit?.kits_items?.filter((i) => i.part_id === lineKey || i.part === lineKey))
					.flat()}
				{@const allocations = lineKey
					? allocations?.filter(
							(allocation) => allocation.orders_item?.part_id === lineKey || allocation.orders_item?.part === lineKey
					  )
					: []}
				{@const orderItems = lineKey ? allocations.flatMap((oi) => oi?.orders_item) : []}
				{@const lineSuppliers = orderItems?.flatMap((oi) => oi?.order?.supplier?.name)}
				{@const orderItemQty = allocations?.reduce(
					(a, allocation) => a + (allocation?.quantity || allocation.order_item?.quantity),
					0
				)}
				{@const receiptItems = orderItems?.map((i) => i.orders_items_receiveds)?.flat()}
				{@const receivedItemQty = receiptItems?.reduce((a, v) => a + v?.quantity, 0)}
				{@const buildQty = lineKey ? lineQty * job?.quantity : 0}
				{@const description = part?.description}
				{@const kittedQty = kitItems?.reduce((a, v) => a + v?.quantity, 0)}
				{@const kittedQtyIndeterminate = kitItems?.some((ki) => ki?.quantity === null)}
				{#if (partSearch == '' || (lineKey || 'Not Fitted')
						?.toLowerCase()
						.includes(partSearch.toLowerCase())) && (descriptionSearch == '' || description
							?.toLowerCase()
							.includes(descriptionSearch.toLowerCase()) || line?.[0]?.description
							?.toLowerCase()
							.includes(descriptionSearch.toLowerCase())) && (supplierSearch == '' || lineSuppliers?.includes(supplierSearch)) && (mountTypeSearch == '' || part?.properties?.type === mountTypeSearch)}
					<TableBodyRow
						color={rowColor(lineKey, buildQty, orderItemQty, receivedItemQty, kittedQty, kittedQtyIndeterminate)}
						class={`cursor-pointer`}
						on:click={(e) => {
							handleRowClick(idx, references, line, lineKey, e);
						}}
					>
						<TableBodyCell tdClass="pl-3 px-2 py-1 whitespace-nowrap font-medium">{idx + 1}</TableBodyCell>
						<TableBodyCollapsible
							tdClass="px-2 py-1 whitespace-nowrap font-medium"
							columnId="type"
							visible={visibleColumns?.includes('part')}
							bind:collapsedColumns={$collapsedColumns}
						>
							{@const type = part?.properties?.type}
							<div class="flex">
								{#if lineKey}
									<button
										on:click|stopPropagation={() => {
											if (mountTypeSearch === type) {
												mountTypeSearch = '';
												return;
											}
											mountTypeSearch = type;
										}}
									>
										<img
											width="20"
											height="20"
											style={'filter:invert(60%)'}
											src={type === 'THT'
												? 'https://img.icons8.com/small/16/capacitor.png'
												: type === 'SMT'
												? 'https://img.icons8.com/metro/26/electronics.png'
												: type === 'PFT'
												? 'https://img.icons8.com/small/16/vise.png'
												: 'https://img.icons8.com/small/16/help.png'}
											alt="capacitor"
										/>
									</button>
								{:else}
									<img
										width="24"
										height="24"
										style={'filter:brightness(0) saturate(10%) invert(30%) sepia(90%) saturate(800%) hue-rotate(340deg)'}
										src="https://img.icons8.com/windows/32/cancel.png"
										alt="capacitor"
									/>
								{/if}

								<Tooltip placement="right" defaultClass="py-2 px-2 text-xs">
									{lineKey ? type || 'UNKNOWN' : 'Not Fitted'}
								</Tooltip>
							</div>
						</TableBodyCollapsible>
						<TableBodyCollapsible
							tdClass="px-2 py-1 whitespace-nowrap font-medium"
							columnId="part"
							visible={visibleColumns?.includes('part')}
							bind:collapsedColumns={$collapsedColumns}
						>
							<div class="flex">
								<p
									class={`${partsInLibrary.length > 0 && partsInLibrary?.includes(lineKey) ? 'underline' : ''} ${
										activeLine?.line?.[0]?.part === lineKey ? 'bg-blue-400 p-1 rounded-sm' : ''
									}`}
								>
									{lineKey || 'Not Fitted'}
								</p>
							</div>
						</TableBodyCollapsible>

						<TableBodyCollapsible
							tdClass="px-2 py-1 whitespace-nowrap font-medium"
							columnId="description"
							visible={visibleColumns?.includes('description')}
							bind:collapsedColumns={$collapsedColumns}
						>
							<div
								class:max-w-sm={$collapsedColumns && !$collapsedColumns?.includes('references')}
								class="max-w-lg scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-400 dark:scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700 overflow-x-auto"
							>
								<p class="text-clip">{description || ''}</p>
								{#if line?.[0]?.description && line?.[0]?.description !== description}
									<p class="text-clip italic text-xs">{line?.[0]?.description}</p>
								{/if}
							</div>
						</TableBodyCollapsible>

						<TableBodyCollapsible
							tdClass="px-2 py-1 whitespace-nowrap font-medium"
							columnId="references"
							visible={visibleColumns?.includes('references')}
							bind:collapsedColumns={$collapsedColumns}
						>
							<BomTableLineReferences pn={lineKey} {references} conoslidate={$collapseReferences} />
						</TableBodyCollapsible>

						{#if visibleColumns?.includes('quantity')}
							<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">{lineQty}</TableBodyCell>
						{/if}

						{#if job?.quantity && visibleColumns?.includes('build_quantity')}
							<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">{buildQty}</TableBodyCell>
						{/if}

						{#if allocations && visibleColumns?.includes('order_quantity')}
							<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
								{#if lineKey}
									<div class="grid grid-cols-1 gap-y-1">
										{#each allocations as allocation}
											<Badge class="mx-0.5" color={!lineKey || orderItemQty < 1 ? 'dark' : qtyColor(orderItemQty, buildQty)}>
												{allocation?.quantity || allocation?.orders_item?.quantity} | {allocation?.orders_item?.order
													?.supplier?.name}
											</Badge>
										{:else}
											<Badge class="mx-0.5" color={!lineKey || orderItemQty < 1 ? 'dark' : qtyColor(orderItemQty, buildQty)}
												>0</Badge
											>
										{/each}
									</div>
								{/if}
							</TableBodyCell>
						{/if}

						{#if allocations && visibleColumns?.includes('received_quantity')}
							<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
								{#if lineKey}
									<Badge
										class="mx-0.5"
										color={!lineKey || orderItemQty < 1 ? 'dark' : qtyColor(receivedItemQty, orderItemQty)}
									>
										{receivedItemQty}
									</Badge>
								{/if}
							</TableBodyCell>
						{/if}

						{#if job?.jobs_kits}
							{@const kitItemQty = kitItems?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}
							{@const kitItemAttritionPercentage = ((kitItemQty - buildQty) / buildQty) * 100 || 0}
							<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
								{#if lineKey}
									<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(kitItemQty, buildQty, kittedQtyIndeterminate)}>
										{#if kittedQtyIndeterminate}
											∞
										{:else}
											{kitItemQty}
										{/if}
									</Badge>
								{/if}
							</TableBodyCell>
							<TableBodyCell tdClass="px-2 py-1 whitespace-nowrap font-medium">
								{#if lineKey}
									<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(kitItemQty, buildQty, kittedQtyIndeterminate)}>
										{#if kittedQtyIndeterminate}
											∞
										{:else}
											{kitItemQty - buildQty} ({Math.round(kitItemAttritionPercentage)}%)
										{/if}
									</Badge>
								{/if}
							</TableBodyCell>
						{/if}
						{#if visibleColumns?.includes('kit_button') && $page?.data?.user}
							<TableBodyCell tdClass="px-6 py-1 whitespace-nowrap font-medium">
								{#if lineKey}
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
								{/if}
							</TableBodyCell>
						{/if}
					</TableBodyRow>
					{#if openRows?.includes(idx)}
						<TableBodyRow class="h-24">
							<TableBodyCell colspan="4" tdClass="px-2 py-1 whitespace-nowrap font-medium">
								<div>
									{#if partsInLibrary.length > 0 && !partsInLibrary?.includes(lineKey)}
										<NewComponent id={lineKey} {description} />
									{:else}
										<PartInfo partId={lineKey} galleryVisible showFootprint />
									{/if}
								</div>
							</TableBodyCell>
							<TableBodyCell colspan="2" tdClass="px-2 py-1 whitespace-nowrap font-medium" />
							<TableBodyCell colspan="6" tdClass="px-2 py-1 whitespace-nowrap font-medium">
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
														style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(800%) hue-rotate(310deg)"
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

<style>
	datalist {
		position: absolute;
		background-color: white;
		border: 1px solid blue;
		border-radius: 0 0 5px 5px;
		border-top: none;
		font-family: sans-serif;
		width: 350px;
		padding: 5px;
	}
</style>
