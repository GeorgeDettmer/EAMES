<script lang="ts">
	import { carrier_urls } from '$lib/utils';
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Badge,
		Button,
		Modal,
		Label,
		Tooltip
	} from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { Plus } from 'svelte-heros-v2';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { ChevronDoubleDownOutline, EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
	import type { Shipment } from '$lib/types';
	import OrderCreateTableRow from './Create/OrderCreateTableRow.svelte';
	import { messagesStore, storage } from 'svelte-legos';
	import { writable } from 'svelte/store';

	export let order;
	export let shipments: Shipment[] = [];
	export let jobs: any[] = [];
	export let user = order?.user || $page?.data?.user;
	export let allowAddLine: boolean = true;
	export let showHeader: boolean = true;

	export let active = true;

	$: categories = $page?.data?.config?.purchasing_order_item_categories || [];

	$: orderItems = order?.orders_items || [];
	$: totalOrdered = orderItems?.reduce((a, v) => a + v.quantity, 0);

	let dispatch = createEventDispatcher();

	function remove(idx: number) {
		order.orders_items = orderItems.toSpliced(idx, 1);
	}
	function add() {
		let matchingLine = orderItems.filter((i) => i.part === newPart?.trim() && i.spn === newSPN?.trim()).length > 0;
		if (matchingLine) {
			messagesStore('This part number already exists on this order!', 'error');
			return;
		}
		let newLine = {
			part: newPart?.trim(),
			spn: newSPN?.trim(),
			price: newPrice,
			quantity: Number(newQuantity),
			/* user_id: user?.id, */
			created_at: new Date().toISOString(),
			/* tracking: newTracking, */
			category: newCategory,
			jobs_allocations: jobs?.[0]
				? [{ job_id: jobs?.[0]?.id, job_batch: jobs?.[0]?.batch, quantity: Number(newQuantity) }]
				: [], //newAllocations,
			__shipmentIdx: newShipmentIdx
		};
		/* if (matchingLine) {
			matchingLine.quantity += newLine.quantity;
		} */
		order.orders_items = [...order.orders_items, newLine];
		addLineModal = false;

		/* newCategory = 'Component'; */
		newPart = '';
		newSPN = '';
		newPrice = 0;
		newQuantity = 1;
		newShipmentIdx = undefined;
		newAllocations = [];
	}

	export let selectedSupplierId: undefined | string = order?.id;

	let addLineModal = false;

	let savedDefaultCategory = storage(writable(''), 'EAMES_orders_defaultCategory');
	$: console.log('savedDefaultCategory', $savedDefaultCategory);
	let newCategory =
		categories?.findIndex((c) => c?.name?.toLowerCase() === $savedDefaultCategory?.toLowerCase()) !== -1
			? $savedDefaultCategory
			: null;
	let newQuantity: number = 1;
	let newPart: string = '';
	let newSPN: string = '';
	let newPrice: number = 0;
	let newAllocations = [];
	let newAllocation = { job_id: jobs?.[0]?.id, job_batch: jobs?.[0]?.batch, quantity: null };
	let newShipmentIdx: number | undefined = undefined;

	let orderTracking = { tracking_number: null, carrier_code: 'ups' };
	$: console.log(orderTracking);

	$: console.log('OrderCreateMulti', order);

	function updateOrderLinesTracking(force: boolean = false) {
		order?.orders_items?.forEach((i) => {
			let url = carrier_urls?.[orderTracking?.carrier_code]
				? carrier_urls?.[orderTracking?.carrier_code](orderTracking?.tracking_number)
				: '';
			i.tracking[0].tracking_url = url;
			i.tracking[0].tracking_number = orderTracking.tracking_number;
			i.tracking[0].carrier_code = orderTracking.carrier_code;
		});
		order = order;
		console.log('ttttttttt', order);
	}

	let selectedGroupShipmentIdx: number | undefined;
	function updateOrderLinesShipments(shipmentIdx: number = 0) {
		order?.orders_items?.forEach((i) => {
			i.__shipmentIdx = shipmentIdx;
		});
		order = order;
		console.log(
			'updateOrderLinesShipments',
			shipmentIdx,
			order?.orders_items?.map((i, idx) => {
				return { line: idx, part: i?.part, __shipmentIdx: shipmentIdx, shipment: shipments[shipmentIdx] };
			})
		);
	}

	$: allVisible = orderItems?.every((i) => !!i?.visible);
	function toggleAllVisibility(visibility: boolean) {
		order?.orders_items?.forEach((i) => {
			i.visible = visibility;
		});
		order.orders_items = order.orders_items;
	}
	$: console.log('allVisible', allVisible);
	onDestroy(() => {
		console.log('OrderCreateMulti', 'destroy');
	});

	$: console.log('newAllocations', newAllocations, newAllocation);
	$: console.log('config', $page?.data?.config, categories);
</script>

<Modal bind:open={addLineModal} size="md">
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="py-4"
		on:keydown={(e) => {
			if (e.key === 'Enter') {
				add();
				addLineModal = false;
			}
		}}
	>
		<div class="grid grid-cols-4 gap-2">
			<div class="col-span-2">
				<Label for="small-input">Part/Item</Label>
				<!-- <Input id="small-input" size="sm" placeholder="Part" bind:value={newPart} /> -->
				<input
					class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					type="text"
					autocomplete="off"
					bind:value={newPart}
				/>
			</div>
			<div class="col-span-2">
				<Label for="small-input">Supplier PN</Label>
				<input
					class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					type="text"
					autocomplete="off"
					bind:value={newSPN}
				/>
				<!-- <Input id="small-input" size="sm" placeholder="Part" bind:value={newSPN} /> -->
			</div>
			<div class="col-span-2">
				<Label for="small-input">Quantity</Label>
				<input
					class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					type="number"
					autocomplete="off"
					min="0"
					bind:value={newQuantity}
				/>
				<!-- <Input id="small-input" size="sm" placeholder="Quantity" bind:value={newQuantity} /> -->
			</div>
			<div class="col-span-2">
				<Label for="small-input">Unit Price</Label>
				<input
					class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					type="number"
					autocomplete="off"
					min="0"
					bind:value={newPrice}
				/>
				<!-- <Input id="small-input" size="sm" placeholder="Price" bind:value={newPrice} /> -->
			</div>

			<div class="col-span-2">
				<Label for="small-input">Category</Label>
				<select
					class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					bind:value={newCategory}
					on:change={(e) => {
						$savedDefaultCategory = newCategory;
					}}
				>
					<option value={null}> Other </option>
					{#each categories as { name }}
						<option value={name}>
							{name}
						</option>
					{/each}
				</select>
				<p class="text-xs">
					{categories?.find((c) => c.name === newCategory)?.description || '-'}
				</p>
			</div>
			<div class="col-span-2">
				<Label for="small-input">Shipment</Label>
				<select
					class="block w-full text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
					bind:value={newShipmentIdx}
				>
					{#each shipments || [] as shipment, idx}
						<option value={idx}>
							{idx + 1}) {shipment?.carrier?.name}
						</option>
					{/each}
				</select>
				<!-- <Input id="small-input" size="sm" placeholder="Price" bind:value={newPrice} /> -->
			</div>
			<!-- <div class="col-span-2">
				<Label for="small-input">Allocations</Label>
				{#each newAllocations as allocation, idx}
					<div class="py-0.5 mx-auto">
						<div
							class="flex w-fit rounded {newAllocations?.reduce((a, v) => a + v.quantity, 0) !== newQuantity
								? 'bg-red-600'
								: 'bg-green-500'}"
						>
							<Badge
								dismissable
								color="blue"
								on:dismiss={() => {
									newAllocations = newAllocations.filter((v, i) => i !== idx);
								}}
							>
								<p class="text-left min-w-14">
									{allocation?.job_id}
									{#if allocation?.job_batch}
										({numberToLetter(allocation.job_batch - 1)})
									{/if}
								</p>
							</Badge>
							<p class="text-xs my-auto text-center font-semibold p-1 cursor-default min-w-8 text-white">
								{allocation?.quantity || newQuantity}
							</p>
						</div>
					</div>
				{/each}
				<div class="flex">
					<select
						class="w-fit text-xs disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-0.5"
						on:change={({ target }) => {
							console.log('change', target.selectedIdx, jobs?.[target.selectedIndex]);
							newAllocation.job_id = jobs?.[target.selectedIndex]?.id;
							newAllocation.job_batch = jobs?.[target.selectedIndex]?.batch;
						}}
					>
						<option value={{ job_id: null, job_batch: null, quantity: null }}> N/A</option>
						{#each jobs || [] as job, idx}
							<option value={job}>
								{idx + 1}) {job.id}
								{#if job?.batch > 0}
									({String.fromCharCode(64 + job.batch)})
								{/if}
							</option>
						{/each}
					</select>
					<input
						class="min-w-8 text-xs disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-0.5"
						bind:value={newAllocation.quantity}
						min="1"
						type="number"
					/>
					<button
						disabled={newAllocation.quantity < 1}
						class="disabled:text-red-600"
						on:click={() => {
							newAllocations = [{ ...newAllocation }, ...newAllocations];
							newAllocation = { job_id: null, job_batch: null, quantity: null };
						}}
					>
						<PlusOutline />
					</button>
				</div>
			</div> -->
		</div>

		<div class="flex pt-6">
			<div class="mx-auto">
				<Table>
					<TableHead>
						<!-- <TableHeadCell>User</TableHeadCell>
					<TableHeadCell>Time/Date</TableHeadCell> -->
						<TableHeadCell>Part</TableHeadCell>
						<TableHeadCell>Order Qty</TableHeadCell>
						<TableHeadCell>Unit Cost</TableHeadCell>
						<TableHeadCell>Total Cost</TableHeadCell>
					</TableHead>
					<TableBody>
						<TableBodyRow class="p-0 object-right">
							<!-- <TableBodyCell tdClass="px-6 py-0 whitespace-nowrap font-sm ">
							<UserIcon size="xs" user={order?.user}>
								{order?.user?.first_name}
								{order?.user?.last_name}
							</UserIcon>
						</TableBodyCell>
						<TableBodyCell>
							<p>{datetimeFormat(new Date().toISOString())}</p>
						</TableBodyCell> -->
							<!-- 					<TableBodyCell>
				{item?.order?.supplier?.reference || ''}
			</TableBodyCell> -->
							<TableBodyCell>
								<div>
									<p>{newPart}</p>
									{#if newSPN}
										<p class="text-xs italic">{newSPN}</p>
									{/if}
								</div>
							</TableBodyCell>
							<TableBodyCell>
								<Badge class="mx-0.5" color={'blue'}>
									{newQuantity}
								</Badge>
							</TableBodyCell>
							<TableBodyCell>
								{new Intl.NumberFormat('en-GB', {
									style: 'currency',
									currency: 'GBP'
								}).format(newPrice)}
							</TableBodyCell>
							<TableBodyCell>
								{new Intl.NumberFormat('en-GB', {
									style: 'currency',
									currency: 'GBP'
								}).format(Math.round((newPrice * newQuantity + Number.EPSILON) * 100) / 100 || 0)}
							</TableBodyCell>
						</TableBodyRow>
					</TableBody>
				</Table>
			</div>
		</div>

		<div class="flex">
			<div class="my-auto mx-auto pt-4">
				<Button color="green" on:click={() => add()} disabled={newQuantity < 1 || newPart === ''}>
					Add <Plus size="16" />
				</Button>
			</div>
		</div>
	</div>
</Modal>

{#if order}
	<!-- {#if order?.id}
		<OrderOverview orderId={order.id} />
	{:else} -->
	<Table>
		<TableHead>
			<TableHeadCell>#</TableHeadCell>
			<TableHeadCell>User</TableHeadCell>
			<!-- <TableHeadCell>Time/Date</TableHeadCell> -->
			<TableHeadCell>Category</TableHeadCell>
			<TableHeadCell>Part</TableHeadCell>
			<TableHeadCell>Order Qty</TableHeadCell>
			<TableHeadCell>Allocations</TableHeadCell>
			<TableHeadCell>Unit Cost</TableHeadCell>
			<TableHeadCell>Total Cost</TableHeadCell>
			<TableHeadCell>
				<div class="flex">
					<select
						class="block w-fit text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-black dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded p-1"
						bind:value={selectedGroupShipmentIdx}
					>
						{#each shipments || [] as shipment, idx}
							<option value={idx}>
								{idx + 1}) {shipment?.carrier?.name || 'Unknown'}
							</option>
						{/each}
					</select>
					<Button color="primary" class="!p-2.5" on:click={(e) => updateOrderLinesShipments(selectedGroupShipmentIdx)}>
						<ChevronDoubleDownOutline class="text-gray-400" />
					</Button>
				</div>
			</TableHeadCell>
			<TableHeadCell>
				{#if $page?.data?.user?.permissions?.['tester']}
					<button
						class="cursor-pointer {!allVisible
							? 'text-gray-300 dark:text-gray-500 hover:text-black hover:dark:text-white'
							: ''}"
						on:click={() => {
							toggleAllVisibility(!allVisible);
						}}
					>
						<EyeSlashOutline size="sm" class="focus:outline-none" />
					</button>
					{#if allVisible}
						<Tooltip placement="left" defaultClass="text-xs py-1 px-2">Hide all line content</Tooltip>
					{/if}
				{/if}
				<button
					class="cursor-pointer"
					on:click={() => {
						dispatch('delete');
					}}
				>
					❌
				</button>
			</TableHeadCell>
			<slot name="head" />
		</TableHead>
		<TableBody>
			{#each orderItems as item, idx}
				<OrderCreateTableRow
					{idx}
					bind:item
					allowSetVisibility={$page?.data?.user?.permissions?.['tester']}
					allocatabledShipments={shipments}
					allocatableJobs={jobs}
					on:remove={(e) => {
						console.log('remove line', e);
						remove(idx);
					}}
				/>
			{:else}
				<TableBodyCell colspan="5">No items allocated to this order</TableBodyCell>
			{/each}
		</TableBody>
		<TableHead>
			<TableBodyCell>
				{orderItems.length + 1}
			</TableBodyCell>
			<TableBodyCell />
			<TableBodyCell />
			<TableBodyCell />
			<TableBodyCell>
				<Badge class="mx-0.5" color="blue">{totalOrdered}</Badge>
			</TableBodyCell>
			<TableBodyCell />
			<TableBodyCell>
				{new Intl.NumberFormat('en-GB', {
					style: 'currency',
					currency: 'GBP'
				}).format(orderItems?.reduce((a, v) => a + v.price * v.quantity, 0))}
			</TableBodyCell>
			<TableBodyCell />
			<TableBodyCell />
			<TableBodyCell>
				<span
					on:click={() => {
						addLineModal = true;
					}}
				>
					<Plus size="24" class="hover:text-green-600 cursor-pointer" />
				</span>
			</TableBodyCell>
			<slot name="foot" />
		</TableHead>
	</Table>
	<!-- {/if} -->
{/if}
