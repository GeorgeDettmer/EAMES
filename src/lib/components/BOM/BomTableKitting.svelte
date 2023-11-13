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
	import UserIcon from '../UserIcon.svelte';
	import NewComponent from './NewComponent.svelte';
	import { createEventDispatcher } from 'svelte';
	import { datetimeFormat } from '$lib/utils';
	import BomTableLineReferences from './BomTableLineReferences.svelte';
	import KitItem from '../Kitting/KitItem.svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import TableHeadCollapsible from '../Misc/Table/TableHeadCollapsible.svelte';
	import TableBodyCollapsible from '../Misc/Table/TableBodyCollapsible.svelte';
	import KitItemRemoveButton from '../Kitting/KitItemRemoveButton.svelte';
	import { XMark } from 'svelte-heros-v2';

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
		if (qty === requiredQty) return 'blue';
		if (qty < requiredQty) return 'red';
		if (qty > requiredQty) return 'green';
	}

	const dispatch = createEventDispatcher();

	function handleRowClick(idx: number, references: string[], line, pn: string | null, event: MouseEvent) {
		console.log('handleRowClick', idx, references, line, event);
		dispatch('row_click', { idx, references, line, event });
		if (!pn) return;
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

	let receiveModal = false;
	let activeLine = {};

	let collapsedColumns: string[] = [];
</script>

<Modal autoclose bind:open={receiveModal} size="lg">
	<KitItem
		kits={job?.jobs_kits?.map((jk) => jk.kit)}
		orderItems={activeLine?.orderItems}
		kitItems={activeLine?.kitItems}
		part={activeLine?.line?.[0]?.part}
	/>
</Modal>

{#if bom}
	<Table hoverable shadow>
		<TableHead>
			<TableHeadCell>#</TableHeadCell>
			<TableHeadCollapsible columnId="part" visible={visibleColumns?.includes('part')} bind:collapsedColumns>
				Part
			</TableHeadCollapsible>
			<TableHeadCollapsible columnId="description" visible={visibleColumns?.includes('description')} bind:collapsedColumns>
				Description
			</TableHeadCollapsible>
			<TableHeadCollapsible columnId="references" visible={visibleColumns?.includes('references')} bind:collapsedColumns>
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
				{@const orderItems = job?.jobs_orders
					?.map((jo) => jo.order?.orders_items?.filter((i) => i.part_id === lineKey || i.part === lineKey))
					.flat()}
				{@const buildQty = lineKey ? references?.length * job?.quantity : 0}
				{@const description = line?.[0]?.partByPart?.description}
				{@const kittedQty = kitItems?.reduce((a, v) => a + v.quantity, 0)}
				<TableBodyRow
					color={!lineKey
						? 'default'
						: kittedQty > 0 && kittedQty < buildQty
						? 'yellow'
						: kittedQty >= buildQty
						? 'green'
						: 'default'}
					class={`cursor-pointer`}
					on:click={(e) => {
						handleRowClick(idx, references, line, lineKey, e);
					}}
				>
					<TableBodyCell>{idx + 1}</TableBodyCell>

					<TableBodyCollapsible columnId="part" visible={visibleColumns?.includes('part')} bind:collapsedColumns>
						<p class={`${partsInLibrary.length > 0 && partsInLibrary?.includes(lineKey) ? 'underline' : ''} }`}>
							{lineKey || 'Not Fitted'}
						</p>
					</TableBodyCollapsible>

					<TableBodyCollapsible
						columnId="description"
						visible={visibleColumns?.includes('description')}
						bind:collapsedColumns
					>
						<p class="overflow-hidden text-clip">{description || ''}</p>
						{#if line?.[0]?.description && line?.[0]?.description !== description}
							<p class="overflow-hidden text-clip italic text-xs">{line?.[0]?.description}</p>
						{/if}
					</TableBodyCollapsible>

					<TableBodyCollapsible columnId="references" visible={visibleColumns?.includes('references')} bind:collapsedColumns>
						<BomTableLineReferences pn={lineKey} {references} />
					</TableBodyCollapsible>

					{#if visibleColumns?.includes('quantity')}
						<TableBodyCell>{references?.length}</TableBodyCell>
					{/if}

					{#if job?.quantity && visibleColumns?.includes('build_quantity')}
						<TableBodyCell>{buildQty}</TableBodyCell>
					{/if}
					{@const orderItemQty = orderItems?.reduce((a, v) => a + v.quantity, 0)}
					{#if job?.jobs_orders && visibleColumns?.includes('order_quantity')}
						<TableBodyCell>
							<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(orderItemQty, buildQty)}>
								{orderItemQty}
							</Badge>
						</TableBodyCell>
					{/if}

					{#if job?.jobs_orders && visibleColumns?.includes('received_quantity')}
						{@const receivedItemQty = orderItems
							?.map((i) => i.orders_items_receiveds?.quantity || 0)
							?.reduce((a, v) => a + v, 0)}

						<TableBodyCell>
							<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(receivedItemQty, orderItemQty)}>
								{receivedItemQty}
							</Badge>
						</TableBodyCell>
					{/if}

					{#if job?.jobs_kits}
						{@const kitItemQty = kitItems?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}
						{@const kitItemAttritionPercentage = ((kitItemQty - buildQty) / buildQty) * 100 || 0}
						<TableBodyCell>
							<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(kitItemQty, buildQty)}>
								{kitItemQty}
							</Badge>
						</TableBodyCell>
						<TableBodyCell>
							<Badge class="mx-0.5" color={!lineKey ? 'dark' : qtyColor(kitItemQty, buildQty)}>
								{kitItemQty - buildQty} ({Math.round(kitItemAttritionPercentage)}%)
							</Badge>
						</TableBodyCell>
					{/if}
					{#if visibleColumns?.includes('kit_button')}
						<TableBodyCell>
							<div
								class="cursor-pointer"
								on:click|stopPropagation={(e) => {
									activeLine = { line, orderItems, kitItems };
									receiveModal = true;
									console.log('activeLine', activeLine);
									e.preventDefault();
								}}
							>
								<PlusOutline />
							</div>
						</TableBodyCell>
					{/if}
				</TableBodyRow>
				<!-- {#if openRow === idx} -->
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
						{#if kitItems}
							<TableBodyCell colspan="5" class="p-0 object-right">
								<div class="px-1 py-1">
									<h1>Kit:</h1>
									<Table>
										<TableHead>
											<TableHeadCell padding="px-1 py-1">Kit</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">User</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">Time/Date</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">Qty</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">Supplier</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">Cost</TableHeadCell>
											<TableHeadCell padding="px-1 py-1">Order</TableHeadCell>
											<TableHeadCell padding="px-1 py-1" />
										</TableHead>
										<TableBody>
											{#each kitItems as item, idx}
												<TableBodyRow>
													<TableBodyCell>
														{job?.jobs_kits?.findIndex((jk) => jk.kit.id === item.kit_id) + 1}
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														<UserIcon user={item?.user} size="sm" />
														<Tooltip placement="left">
															{datetimeFormat(item.updated_at)}
														</Tooltip>
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{datetimeFormat(item.updated_at)}
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{item?.quantity}
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{item?.orders_item?.order?.supplier?.name || 'Unknown'}
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{new Intl.NumberFormat('en-GB', {
															style: 'currency',
															currency: 'GBP'
														}).format(
															Math.round((item?.orders_item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0
														)}
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														{#if item?.orders_item?.order?.id}
															<a href={`${window.origin}/order/${item?.orders_item?.order?.id}`} target="_blank">
																{item?.orders_item?.order?.id}
															</a>
														{:else}
															N/A
														{/if}
													</TableBodyCell>
													<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-sm ">
														<KitItemRemoveButton id={item.id}><XMark size="16" /></KitItemRemoveButton>
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
									</Table>
								</div>
							</TableBodyCell>
						{/if}
					</TableBodyRow>
				{/if}
			{/each}
		</TableBody>
	</Table>
{/if}
