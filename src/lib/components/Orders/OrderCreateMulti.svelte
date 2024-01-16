<script lang="ts">
	import { carrier_names, carrier_urls, carrier_codes, datetimeFormat } from '$lib/utils';
	import {
		Table,
		TableHead,
		TableHeadCell,
		TableBody,
		TableBodyRow,
		TableBodyCell,
		Badge,
		Input,
		Button,
		ButtonGroup,
		Modal,
		Label,
		Select,
		Tooltip
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import { page } from '$app/stores';
	import OrderOverview from './OrderOverview.svelte';
	import { Plus } from 'svelte-heros-v2';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { ChevronDoubleDownOutline } from 'flowbite-svelte-icons';
	import TableBodyCellEditable from '../Misc/Table/TableBodyCellEditable.svelte';
	import EditableText from '../Misc/EditableText.svelte';

	export let order;
	export let user = order?.user || $page?.data?.user;
	export let allowAddLine: boolean = true;
	export let showHeader: boolean = true;

	export let active = true;

	interface Category {
		id: string | null;
		text?: string;
	}
	export let categories: Array<Category> = [
		{ id: null, text: 'Unknown' },
		{ id: 'Component' },
		{ id: 'Tooling' },
		{ id: 'PCB' },
		{ id: 'Consumables' },
		{ id: 'Other' }
	];

	$: orderItems = order?.orders_items || [];
	$: totalOrdered = orderItems?.reduce((a, v) => a + v.quantity, 0);

	let dispatch = createEventDispatcher();

	function remove(idx: number) {
		order.orders_items = orderItems.toSpliced(idx, 1);
	}
	function add() {
		let matchingLine = orderItems.filter((i) => i.part === newPart)?.[0];
		let newLine = {
			part: newPart?.trim(),
			spn: newSPN?.trim(),
			price: newPrice,
			quantity: Number(newQuantity),
			/* user_id: user?.id, */
			created_at: new Date().toISOString(),
			tracking: newTracking,
			category: newCategory
		};
		/* if (matchingLine) {
			matchingLine.quantity += newLine.quantity;
		} */
		order.orders_items = [...order.orders_items, newLine];
		addLineModal = false;

		newCategory = 'Component';
		newPart = '';
		newSPN = '';
		newPrice = 0;
		newQuantity = 0;
		newTracking = [{ tracking_number: null, carrier_code: 'ups' }];
	}

	export let selectedSupplierId: undefined | string = order?.id;

	let addLineModal = false;

	let newCategory = 'Component';
	let newQuantity = 0;
	let newPart = '';
	let newSPN = '';
	let newPrice = 0;
	let newTracking = [{ tracking_number: null, carrier_code: 'ups' }];

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
	onDestroy(() => {
		console.log('OrderCreateMulti', 'destroy');
	});
</script>

<Modal bind:open={addLineModal} size="md">
	<div
		class="py-4"
		on:keydown={(e) => {
			console.log(e);
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
				>
					{#each categories as { id, text }}
						<option value={id}>
							{text || id}
						</option>
					{/each}
				</select>
				<!-- <Input id="small-input" size="sm" placeholder="Price" bind:value={newPrice} /> -->
			</div>

			<!--<div class="col-span-3">
				<Label for="small-input"
					>Tracking<span
						class="cursor-pointer"
						on:click={() => {
							newTracking = [...newTracking, { tracking_number: null, carrier_code: 'ups' }];
						}}
					>
						➕
					</span>
				</Label>
				 {#each newTracking as track, idx}
					<ButtonGroup size="sm">
						<Input
							defaultClass="block w-48 disabled:cursor-not-allowed disabled:opacity-50"
							type="text"
							placeholder="Carrier code"
							size="sm"
							bind:value={track.carrier_code}
						/>
						<Input
							defaultClass="block w-48 disabled:cursor-not-allowed disabled:opacity-50"
							type="text"
							placeholder="Tracking number"
							size="sm"
							bind:value={track.tracking_number}
						/>
						<span
							class="cursor-pointer"
							on:click={() => {
								newTracking = newTracking.toSpliced(idx, 1);
							}}
						>
							❌
						</span>
					</ButtonGroup>
				{/each} 
			</div>-->
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
	{#if order?.id}
		<OrderOverview orderId={order.id} />
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell>#</TableHeadCell>
				<TableHeadCell>User</TableHeadCell>
				<!-- <TableHeadCell>Time/Date</TableHeadCell> -->
				<TableHeadCell>Category</TableHeadCell>
				<TableHeadCell>Part</TableHeadCell>
				<TableHeadCell>Order Qty</TableHeadCell>
				<TableHeadCell>Unit Cost</TableHeadCell>
				<TableHeadCell>Total Cost</TableHeadCell>
				<TableHeadCell>
					<ButtonGroup size="sm">
						<Select
							items={[
								{ value: null, name: 'Other' },
								...carrier_codes.map((code, idx) => {
									return { value: code, name: carrier_names?.[idx] };
								})
							]}
							bind:value={orderTracking.carrier_code}
							placeholder="Carrier"
							size="sm"
						/>
						<!-- <Input
							defaultClass="block w-24 disabled:cursor-not-allowed disabled:opacity-50"
							type="text"
							placeholder="Carrier code"
							size="sm"
							bind:value={order.carrier_code}
							on:change={() => updateOrderLinesTracking()}
						/> -->
						<Input
							defaultClass="block w-48 disabled:cursor-not-allowed disabled:opacity-50"
							type="text"
							placeholder="Tracking number"
							size="sm"
							bind:value={orderTracking.tracking_number}
						/>
						<Button color="primary" class="!p-2.5" on:click={() => updateOrderLinesTracking()}>
							<ChevronDoubleDownOutline class="text-gray-400" />
						</Button>
					</ButtonGroup>
				</TableHeadCell>
				<TableHeadCell>
					<span
						class="cursor-pointer"
						on:click={() => {
							dispatch('delete');
						}}
					>
						❌
					</span>
				</TableHeadCell>
				<slot name="head" />
			</TableHead>
			<TableBody>
				{#each orderItems as item, idx}
					<TableBodyRow class="p-0 object-right">
						<TableBodyCell tdClass="px-6 py-1">
							{idx + 1}
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							<UserIcon size="xs" user={item?.user || order?.user}>
								{item?.user?.first_name || order?.user?.first_name}
								{item?.user?.last_name || order?.user?.last_name}
							</UserIcon>
							<Tooltip placement="right">
								<p>{datetimeFormat(item.created_at)}</p>
							</Tooltip>
						</TableBodyCell>
						<!-- <TableBodyCell>
							<p>{datetimeFormat(item.created_at)}</p>
						</TableBodyCell> -->

						<TableBodyCellEditable
							tdClass="px-6 py-1 cursor-pointer"
							bind:value={item.category}
							inputType="dropdown"
							options={categories}
						>
							{item?.category || 'Unknown'}
						</TableBodyCellEditable>
						<!-- <TableBodyCell>
							<p>{item?.category || 'Unknown'}</p>
						</TableBodyCell> -->
						<!-- 					<TableBodyCell>
						{item?.order?.supplier?.reference || ''}
					</TableBodyCell> -->
						<TableBodyCell tdClass="px-6 py-1">
							<div>
								<EditableText bind:innerText={item.part} />
								<!-- <p>{item?.part}</p> -->
								{#if item?.spn}
									<EditableText classes="text-xs italic" bind:innerText={item.spn} />
									<!-- <p class="text-xs italic">{item?.spn}</p> -->
								{/if}
							</div>
						</TableBodyCell>
						<!-- <TableBodyCell tdClass="px-6 py-1">
							<Badge class="mx-0.5" color={'blue'}>
								{item?.quantity}
							</Badge>
						</TableBodyCell> -->
						<TableBodyCellEditable tdClass="px-6 py-1 cursor-pointer" bind:value={item.quantity} inputType="number">
							<Badge class="mx-0.5" color={'blue'}>
								{item?.quantity}
							</Badge>
						</TableBodyCellEditable>
						<TableBodyCellEditable tdClass="px-6 py-1 cursor-pointer" bind:value={item.price} inputType="number">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(item?.price || 0)}
						</TableBodyCellEditable>
						<TableBodyCell tdClass="px-6 py-1">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							<div>
								<ButtonGroup size="sm">
									<!-- <Input
										defaultClass="block w-24 disabled:cursor-not-allowed disabled:opacity-50"
										type="text"
										placeholder="Carrier code"
										size="sm"
										bind:value={item.tracking[0].carrier_code}
									/> -->
									<Select
										items={[
											{ value: null, name: 'Other' },
											...carrier_codes.map((code, idx) => {
												return { value: code, name: carrier_names?.[idx] };
											})
										]}
										bind:value={item.tracking[0].carrier_code}
										placeholder="Carrier"
										size="sm"
									/>
									<Input
										defaultClass="block w-48 disabled:cursor-not-allowed disabled:opacity-50"
										type="text"
										placeholder="Tracking number"
										size="sm"
										bind:value={item.tracking[0].tracking_number}
									/>
								</ButtonGroup>
							</div>
						</TableBodyCell>
						<TableBodyCell tdClass="px-6 py-1">
							<span
								class="cursor-pointer"
								on:click={() => {
									remove(idx);
								}}
							>
								❌
							</span>
						</TableBodyCell>
						<slot name="body" />
					</TableBodyRow>
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
	{/if}
{/if}
