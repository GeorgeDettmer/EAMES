<script lang="ts">
	import { datetimeFormat } from '$lib/utils';
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
		Toggle
	} from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';
	import OrdersListItem from './OrdersListItem.svelte';
	import { ChevronDownSolid, SearchOutline } from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import { messagesStore } from 'svelte-legos';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import OrderOverview from './OrderOverview.svelte';
	import { goto } from '$app/navigation';

	export let order;
	export let user = order?.user;

	$: orderItems = order?.orders_items;
	$: totalOrdered = orderItems?.reduce((a, v) => a + v.quantity, 0);

	function remove(idx: number) {
		order.orders_items = orderItems.toSpliced(idx, 1);
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
				mutation insertOrder($supplier_id: String!, $user_id: uuid!) {
					insert_erp_orders_one(object: { supplier_id: $supplier_id, user_id: $user_id }) {
						id
					}
				}
			`,
			{ supplier_id: order.supplier_id, user_id: order.user_id }
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
				erp_suppliers(order_by: { orders_aggregate: { count: desc } }) {
					id
					name
				}
			}
		`,
		variables: {}
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers;
	$: console.log('suppliers', suppliers);

	$: showSupplierSelect = false; //!order?.supplier_id;
	$: supplier = suppliers?.filter((s) => s.id === selectedSupplierId)?.[0];

	$: {
		if (suppliers) {
			order.supplier_id = suppliers?.[0]?.id;
			order.supplier = suppliers?.[0];
		}
	}

	let selectedSupplierId;
	$: console.log('supplier', selectedSupplierId, supplier);

	let jobListVisible = false;
</script>

{#if order}
	<div class="grid grid-cols-2">
		<div class="flex">
			<div class="cursor-pointer" on:click={() => (showSupplierSelect = !showSupplierSelect)}>
				<OrdersListItem {order} interactive={false}>
					{#if showSupplierSelect}
						<div class="pl-4 w-fit" on:click|stopPropagation={() => {}}>
							<Select
								size="sm"
								placeholder=""
								items={suppliers?.map((s) => {
									return { value: s.id, name: s.name };
								})}
								bind:value={selectedSupplierId}
								on:change={() => {
									showSupplierSelect = false;
									order.supplier = supplier;
									order.supplier_id = supplier.id;
								}}
							/>
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
			<div class="flex p-4 gap-4">
				{#if jobListVisible}
					<Select items={jobs} bind:value={job} placeholder="Select job" />
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
					Submit
				</Button>
			</div>
		</div>
	</div>
	{#if order?.id}
		<OrderOverview orderId={order.id} />
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell>User</TableHeadCell>
				<TableHeadCell>Time/Date</TableHeadCell>
				<!-- 			<TableHeadCell>Reference</TableHeadCell> -->
				<TableHeadCell>Part</TableHeadCell>
				<TableHeadCell>Order Qty</TableHeadCell>
				<TableHeadCell>Unit Cost</TableHeadCell>
				<TableHeadCell>Total Cost</TableHeadCell>
				<TableHeadCell>Tracking</TableHeadCell>
				<TableHeadCell />
				<slot name="head" />
			</TableHead>
			<TableBody>
				{#each orderItems as item, idx}
					<TableBodyRow class="p-0 object-right">
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
							{item?.part || ''}
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
							<ButtonGroup size="sm">
								<Button
									size="sm"
									color="none"
									class="flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
								>
									<ChevronDownSolid class="w-2 h-2 ml-2 text-white dark:text-white" />
								</Button>
								<Dropdown>
									<DropdownItem>UPS</DropdownItem>
								</Dropdown>
								<Input type="text" placeholder="Tracking number" size="sm" />
								<!-- <Button color="primary" class="!p-2.5">
								<SearchOutline class="w-5 h-5" />
							</Button> -->
							</ButtonGroup>
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
				<slot name="foot" />
			</TableHead>
		</Table>
	{/if}
{/if}
