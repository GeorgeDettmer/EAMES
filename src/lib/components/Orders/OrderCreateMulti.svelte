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
		Checkbox,
		Select
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import { page } from '$app/stores';
	import OrderOverview from './OrderOverview.svelte';
	import { Plus } from 'svelte-heros-v2';
	import { onDestroy } from 'svelte';
	import { ChevronDoubleDownOutline } from 'flowbite-svelte-icons';

	export let order;
	export let user = order?.user || $page?.data?.user;
	export let allowAddLine: boolean = true;
	export let showHeader: boolean = true;

	export let active = true;

	$: orderItems = order?.orders_items || [];
	$: totalOrdered = orderItems?.reduce((a, v) => a + v.quantity, 0);

	function remove(idx: number) {
		order.orders_items = orderItems.toSpliced(idx, 1);
	}
	function add() {
		let matchingLine = orderItems.filter((i) => i.part === newPart)?.[0];
		let newLine = {
			part: newPart,
			spn: newSPN,
			price: newPrice,
			quantity: Number(newQuantity),
			user_id: user?.id,
			user: user,
			created_at: new Date().toISOString(),
			tracking: newTracking
		};
		if (matchingLine) {
			matchingLine.quantity += newLine.quantity;
		}
		order.orders_items = [...order.orders_items, newLine];
		addLineModal = false;
	}

	export let selectedSupplierId: undefined | string = order?.id;

	let addLineModal = false;

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

<Modal bind:open={addLineModal} size="lg">
	<div class="py-4">
		<div class="grid grid-cols-4 gap-2">
			<div class="col-span-2">
				<Label for="small-input">Part/Item</Label>
				<Input id="small-input" size="sm" placeholder="Part" bind:value={newPart} />
			</div>
			<div class="col-span-2">
				<Label for="small-input">Supplier PN</Label>
				<Input id="small-input" size="sm" placeholder="Part" bind:value={newSPN} />
			</div>
			<div class="col-span-2">
				<Label for="small-input">Quantity</Label>
				<Input id="small-input" size="sm" placeholder="Quantity" bind:value={newQuantity} />
			</div>
			<div class="col-span-2">
				<Label for="small-input">Unit Price</Label>
				<Input id="small-input" size="sm" placeholder="Price" bind:value={newPrice} />
			</div>
			<div class="my-auto ml-auto pt-4">
				<Button color="green" size="sm" on:click={() => add()} disabled={newQuantity < 1 || newPart === ''}>Add ➕</Button>
			</div>
			<div class="col-span-3">
				<Label for="small-input"
					>Tracking<span
						class="cursor-pointer"
						on:click={() => {
							newTracking = [...newTracking, { tracking_number: null, carrier_code: 'ups' }];
						}}
					>
						<!-- <Plus size="20" class="hover:text-green-600 cursor-pointer" /> -->
						➕
					</span>
				</Label>
				{#each newTracking as track, idx}
					<ButtonGroup size="sm">
						<!-- <Button
							size="sm"
							color="none"
							class="flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
						>
							<ChevronDownSolid class="w-2 h-2 ml-2 text-white dark:text-white" />
						</Button> -->
						<!-- <Dropdown bind:value={track.carrier_code}>
							{#each carrier_codes as c}
								<DropdownItem>{c}</DropdownItem>
							{/each}
						</Dropdown> -->

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
						<!-- <Button color="primary" class="!p-2.5">
			<SearchOutline class="w-5 h-5" />
		</Button> -->
					</ButtonGroup>
				{/each}
			</div>
		</div>

		<div class="flex pt-4">
			<Table>
				<TableHead>
					<TableHeadCell>User</TableHeadCell>
					<TableHeadCell>Time/Date</TableHeadCell>
					<TableHeadCell>Part</TableHeadCell>
					<TableHeadCell>Order Qty</TableHeadCell>
					<TableHeadCell>Unit Cost</TableHeadCell>
					<TableHeadCell>Total Cost</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow class="p-0 object-right">
						<TableBodyCell tdClass="px-1 py-0 whitespace-nowrap font-sm ">
							<UserIcon size="xs" user={order?.user}>
								{order?.user?.first_name}
								{order?.user?.last_name}
							</UserIcon>
						</TableBodyCell>
						<TableBodyCell>
							<p>{datetimeFormat(new Date().toISOString())}</p>
						</TableBodyCell>
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
</Modal>

{#if order}
	{#if order?.id}
		<OrderOverview orderId={order.id} />
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell>#</TableHeadCell>
				<TableHeadCell>User</TableHeadCell>
				<TableHeadCell>Time/Date</TableHeadCell>
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
							<ChevronDoubleDownOutline />
						</Button>
					</ButtonGroup>
				</TableHeadCell>
				<TableHeadCell>
					<!-- <span
						class="cursor-pointer"
						on:click={() => {
							order = {};
						}}
					>
						❌
					</span> -->
				</TableHeadCell>
				<slot name="head" />
			</TableHead>
			<TableBody>
				{#each orderItems as item, idx}
					<TableBodyRow class="p-0 object-right">
						<TableBodyCell>
							{idx + 1}
						</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-0 whitespace-nowrap font-sm ">
							<UserIcon size="xs" user={item?.user || order?.user}>
								{item?.user?.first_name || order?.user?.first_name}
								{item?.user?.last_name || order?.user?.last_name}
							</UserIcon>
						</TableBodyCell>
						<TableBodyCell>
							<p>{datetimeFormat(item.created_at)}</p>
						</TableBodyCell>
						<!-- 					<TableBodyCell>
						{item?.order?.supplier?.reference || ''}
					</TableBodyCell> -->
						<TableBodyCell>
							<div>
								<p>{item?.part}</p>
								{#if item?.spn}
									<p class="text-xs italic">{item?.spn}</p>
								{/if}
							</div>
						</TableBodyCell>
						<TableBodyCell>
							<Badge class="mx-0.5" color={'blue'}>
								{item?.quantity}
							</Badge>
						</TableBodyCell>
						<TableBodyCell>
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(item?.price || 0)}
						</TableBodyCell>
						<TableBodyCell>
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
						</TableBodyCell>
						<TableBodyCell>
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
						<TableBodyCell>
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
