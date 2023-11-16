<script lang="ts">
	import { carrier_codes, carrier_urls, datetimeFormat, supplier_export } from '$lib/utils';
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
		Dropdown,
		DropdownItem,
		Select,
		Toggle,
		Modal,
		Spinner,
		Label
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';
	import { ChevronDownSolid, SearchOutline } from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import OrderOverview from './OrderOverview.svelte';
	import { goto } from '$app/navigation';
	import { BarsArrowDown, Link, Plus, PlusCircle } from 'svelte-heros-v2';

	export let order;
	export let user = order?.user || $page?.data?.user;
	export let allowAddLine: boolean = true;
	export let showHeader: boolean = true;

	export let active = true;

	$: orderItems = order?.orders_items || [];
	$: totalOrdered = orderItems?.reduce((a, v) => a + v.quantity, 0);
	//$: console.log('orderItems', orderItems);

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
	const urqlClient = getContextClient();
	let orderAdding = false;
	async function addOrder() {
		if (orderAdding) return;
		if (!$page?.data?.user) {
			messagesStore('You must be logged in to perform this action', 'warning');
			return;
		}
		if (orderItems.length === 0) {
			messagesStore('There must be some order items to submit an order', 'warning');
			return;
		}
		/* if (!$page?.data?.user?.processes['eng']) {
			alert(
				`You do not have permission to insert components. You have permission for: ${Object.keys(
					$page?.data?.user?.processes
				)}`
			);
			return;
		} */
		orderAdding = true;
		let mutationResult;
		console.log('sid', supplier, order.supplier.id);
		mutationResult = await urqlClient.mutation(
			gql`
				mutation insertOrder($supplier_id: String!, $user_id: uuid!, $reference: String) {
					insert_erp_orders_one(object: { supplier_id: $supplier_id, user_id: $user_id, reference: $reference }) {
						id
					}
				}
			`,
			{ supplier_id: order.supplier_id, user_id: order.user_id, reference: order.reference }
		);
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			messagesStore('Inserted order: ' + mutationResult?.data?.insert_erp_orders_one?.id, 'success');
		}
		if (mutationResult?.data?.insert_erp_orders_one?.id) {
			console.log('oo', orderItems);
			let items = orderItems;
			order.id = mutationResult?.data?.insert_erp_orders_one?.id;
			items.forEach((i) => {
				i.order_id = mutationResult?.data?.insert_erp_orders_one?.id;
				if (!i?.tracking) {
					if (carrier_urls?.[orderTracking?.carrier_code]) {
						orderTracking.tracking_url = carrier_urls?.[orderTracking?.carrier_code](orderTracking?.tracking_number);
					}
					i.tracking = [orderTracking];
				} else {
					i?.tracking?.map((t) => {
						if (carrier_urls?.[orderTracking?.carrier_code]) {
							t.tracking_url = carrier_urls?.[t?.carrier_code](t?.tracking_number);
						}
					});
				}
				console.log('tracking set:', i?.tracking);
			});
			mutationResult = await urqlClient.mutation(
				gql`
					mutation insertOrderItems($items: [erp_orders_items_insert_input!] = {}) {
						insert_erp_orders_items(objects: $items) {
							returning {
								id
							}
						}
					}
				`,
				{ items }
			);
		}
		if (mutationResult?.error) {
			console.error('MUTATION ERROR: ', mutationResult);
			messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
		} else {
			console.log('MUTATION RESULT: ', mutationResult);
			if (mutationResult?.error) {
				console.error('MUTATION ERROR: ', mutationResult);
				messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
			} else {
				console.log('MUTATION RESULT: ', mutationResult);
				//goto('/order/' + order.id, { invalidateAll: true, replaceState: true });
			}
			console.log('job id---', job);
			if (job?.id) {
				mutationResult = await urqlClient.mutation(
					gql`
						mutation createJobOrder($job_id: bigint!, $order_id: bigint!) {
							insert_erp_jobs_orders_one(object: { job_id: $job_id, order_id: $order_id }) {
								id
							}
						}
					`,
					{ order_id: order.id, job_id: job.id }
				);
				if (mutationResult?.error) {
					console.error('MUTATION ERROR: ', mutationResult);
					messagesStore('DATABASE ERROR: ' + mutationResult?.error, 'error');
				} else {
					console.log('MUTATION RESULT: ', mutationResult);
				}
			}

			goto('/order/' + order.id, { invalidateAll: true, replaceState: true });
		}
		orderAdding = false;
	}

	$: jobsStore = subscriptionStore({
		client: getContextClient(),
		query: gql`
			subscription order {
				jobs(order_by: { id: desc }) {
					id
					batch
					customer {
						name
					}
				}
			}
		`
	});
	$: jobs = $jobsStore?.data?.jobs?.map((j) => {
		return { value: j, name: `${j.id} (${j.batch})` };
	});
	let job;

	$: suppliersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query suppliers {
				erp_suppliers(order_by: { name: asc }) {
					id
					name
					names
				}
			}
		`,
		variables: {}
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers;

	$: showSupplierSelect = false; //!order?.supplier_id;

	export let selectedSupplierId: undefined | string = order?.id;
	$: supplier = suppliers?.filter((s) => s?.id === selectedSupplierId)?.[0];

	let jobListVisible = false;
	let addLineModal = false;

	let newQuantity = 0;
	let newPart = '';
	let newSPN = '';
	let newPrice = 0;
	let newTracking = [{ tracking_number: null, carrier_code: 'ups' }];

	let orderTracking = { tracking_number: null, carrier_code: 'ups' };

	$: console.log('OrderCreateMulti', order);
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
	{#if showHeader}
		<div class="grid grid-cols-4">
			<div class="flex col-span-3">
				<div
					class="cursor-pointer"
					on:click={() => {
						if (!active) return;
						showSupplierSelect = !showSupplierSelect;
					}}
				>
					<OrdersListItem {order} interactive={false}>
						{#if showSupplierSelect}
							<div class=" w-fit flex" on:click|stopPropagation={() => {}}>
								<div class="pl-2 my-auto">
									<Select
										size="sm"
										placeholder=""
										items={suppliers?.map((s) => {
											return { value: s.id, name: s.name };
										})}
										bind:value={selectedSupplierId}
										on:change={() => {
											showSupplierSelect = false;
											let supplier = suppliers?.filter((s) => s.id === selectedSupplierId)?.[0];
											//console.log(supplier);
											order.supplier.name = supplier.name;
											order.supplier.names = supplier.names;
											order.supplier.id = supplier.id;
											order.supplier_id = supplier?.id;
										}}
									/>
								</div>
								{#if Object.keys(supplier_export).includes(selectedSupplierId)}
									<div class="grid grid-rows-2 gap-y-1 my-auto">
										{#each Object.keys(supplier_export[selectedSupplierId]) as type}
											<div class="-my-2">
												<Button
													size="sm"
													class=" hover:text-green-600 text-sm"
													on:click={() => {
														supplier_export[selectedSupplierId][type](order);
													}}
												>
													<BarsArrowDown size="20" />
													<p class="text-xs">{type}</p>
												</Button>
											</div>
										{/each}
									</div>
								{/if}
								<div class="w-24 my-auto ml-2">
									<!-- <Label defaultClass="text-xs font-medium block">
								Reference: -->
									<Input bind:value={order.reference} placeholder="Reference" size="sm" />
									<!-- </Label> -->
								</div>
							</div>
						{/if}
					</OrdersListItem>
				</div>
				<div class="pt-2 pl-2">
					<UserIcon size="sm" user={order?.user}>
						{order?.user?.first_name}
						{order?.user?.last_name}
					</UserIcon>
				</div>
			</div>
			<div class="flex flex-row ml-auto my-auto gap-1">
				<div />
				<div class="flex gap-4">
					{#if jobListVisible}
						<Select items={jobs} bind:value={job} placeholder="Select job" size="sm" />
					{/if}
					<Toggle color="blue" bind:checked={jobListVisible}>Job</Toggle>
				</div>
				<div class="my-auto">
					<Button
						color="green"
						size="sm"
						disabled={orderAdding}
						on:click={() => {
							addOrder();
						}}
					>
						Create order
					</Button>
				</div>
			</div>
		</div>
	{/if}

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
						<Input
							defaultClass="block w-24 disabled:cursor-not-allowed disabled:opacity-50"
							type="text"
							placeholder="Carrier code"
							size="sm"
							bind:value={orderTracking.carrier_code}
						/>
						<Input
							defaultClass="block w-48 disabled:cursor-not-allowed disabled:opacity-50"
							type="text"
							placeholder="Tracking number"
							size="sm"
							bind:value={orderTracking.tracking_number}
						/>
						<!-- <Button color="primary" class="!p-2.5">
	<SearchOutline class="w-5 h-5" />
</Button> -->
					</ButtonGroup>
				</TableHeadCell>
				<TableHeadCell />
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
							{#each item?.tracking || [] as track}
								<div>
									<ButtonGroup size="sm">
										<Input
											defaultClass="block w-24 disabled:cursor-not-allowed disabled:opacity-50"
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

										<Button color="primary" class="!p-2.5" disabled>
											<Link size="10" class="w-5 h-5" />
										</Button>
									</ButtonGroup>
								</div>
							{:else}
								<ButtonGroup size="sm">
									<Input
										defaultClass="block w-24 disabled:cursor-not-allowed disabled:opacity-50"
										type="text"
										placeholder="Carrier code"
										size="sm"
										bind:value={orderTracking.carrier_code}
										disabled
									/>
									<Input
										defaultClass="block w-48 disabled:cursor-not-allowed disabled:opacity-50"
										type="text"
										placeholder="Tracking number"
										size="sm"
										bind:value={orderTracking.tracking_number}
										disabled
									/>
									<Button color="primary" class="!p-2.5">
										<Link size="10" class="w-5 h-5" />
									</Button>
								</ButtonGroup>
							{/each}
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
					<span
						on:click={() => {
							addLineModal = true;
						}}
					>
						<Plus size="20" class="hover:text-green-600 cursor-pointer" />
					</span>
				</TableBodyCell>
				<TableBodyCell />
				<TableBodyCell />
				<TableBodyCell />
				<TableBodyCell>
					<Badge class="mx-0.5" color="blue">{totalOrdered}</Badge>
				</TableBodyCell>

				<TableBodyCell>
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: 'GBP'
					}).format(orderItems?.reduce((a, v) => a + v.price * v.quantity, 0))}
				</TableBodyCell>
				<TableBodyCell />
				<TableBodyCell />
				<TableBodyCell />
				<slot name="foot" />
			</TableHead>
		</Table>
	{/if}
{/if}
