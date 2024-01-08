<script lang="ts">
	import { page } from '$app/stores';
	import OrderOverview from '$lib/components/Orders/OrderOverview.svelte';
	import OrderEditable from '$lib/components/Orders/OrderEditable.svelte';
	import { getContextClient, gql, queryStore, type OperationResultStore } from '@urql/svelte';
	import type { PageData } from './$types';
	import UserIcon from '$lib/components/UserIcon.svelte';
	import {
		Badge,
		Popover,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Tooltip
	} from 'flowbite-svelte';
	import TableHeadCollapsible from '$lib/components/Misc/Table/TableHeadCollapsible.svelte';
	import { writable } from 'svelte/store';
	import { intervalFnStore, storage } from 'svelte-legos';
	import { ChevronDown, ChevronLeft, ChevronRight, XMark } from 'svelte-heros-v2';
	import TableBodyCollapsible from '$lib/components/Misc/Table/TableBodyCollapsible.svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { classes, datetimeFormat, getSelectionText, padString, replaceStateWithQuery } from '$lib/utils';
	import OrderDetailTable from '$lib/components/Orders/OrderDetailTable.svelte';
	import { windowTitleStore } from '$lib/stores';
	import OrdersListItem from '$lib/components/Orders/OrdersListItem.svelte';
	import SupplierInfo from '$lib/components/Supplier/SupplierInfo.svelte';

	export let data: PageData;

	$: orderId = $page?.data?.orderId;
	//TODO: Orders without job not in query result
	let client = getContextClient();
	let query = gql`
		query orders($where: erp_orders_bool_exp, $limit: Int = 100, $offset: Int = 0) {
			erp_orders(order_by: { id: desc }, limit: $limit, offset: $offset, where: $where) {
				id
				reference
				created_at
				jobs_orders {
					job {
						id
						batch
					}
				}
				orders_items_aggregate {
					aggregate {
						count
						sum {
							price
							quantity
						}
					}
				}
				orders_items {
					category
					price
					quantity
					orders_items_receiveds_aggregate {
						aggregate {
							sum {
								quantity
							}
						}
					}
				}
				supplier {
					id
					name
				}
				user {
					id
					username
					first_name
					last_name
					initials
					color
				}
			}
		}
	`;

	let queryOffset: number = 0;
	let queryLimit = storage(writable(200), 'EAMES_orders_limit');
	let ordersStore: OperationResultStore;
	//TODO: Clap upper limit of offset so as not to go past last id...
	//TODO: If filter applied adjust offset?
	$: if (!orderId) {
		ordersStore = queryStore({
			client,
			query,
			variables: {
				limit: isFiltered ? 1000 : $queryLimit,
				offset: isFiltered ? 0 : queryOffset,
				where: {
					id:
						idSearch && !orderReferenceSearch
							? {
									_in: idSearch
										.split(',')
										.map((v) => v.replace(/\D/g, ''))
										.filter((v) => !!v)
							  }
							: {},
					supplier_id: supplierSearch ? { _eq: supplierSearch } : {},
					jobs_orders: jobSearch
						? {
								job_id: {
									_in: jobSearch
										.split(',')
										.map((v) => v.replace(/\D/g, ''))
										.filter((v) => !!v)
								}
						  }
						: undefined,
					reference: orderReferenceSearch ? { _ilike: `%${orderReferenceSearch}%` } : {},
					user_id: buyerSearch ? { _eq: buyerSearch } : {},
					created_at: dateSearch?.[0] ? { _gte: dateSearch[0], _lte: `${dateSearch[0]}T23:59:59` } : {}
				}
				/* supplierIdCriteria: supplierSearch ? { _eq: supplierSearch } : {},
				userIdCriteria: buyerSearch ? { _eq: buyerSearch } : {},
				orderReferenceCriteria: orderReferenceSearch ? { _ilike: `%${orderReferenceSearch}%` } : {},
				jobIdsCriteria: jobSearch ? { job_id: { _in: jobSearch.split(',').map((v) => v.replace(/\D/g, '')) } } : {},
				idsCriteria: idSearch ? { _in: idSearch.split(',').map((v) => v.replace(/\D/g, '')) } : {} */
			},
			requestPolicy: 'cache-and-network'
		});
		lastRefreshedAt = new Date();
	}

	$: isFiltered = supplierSearch || buyerSearch || orderReferenceSearch || jobSearch || idSearch;

	let lastRefreshedAt;
	let oldOrders = [];
	function refresh() {
		if (orderId) return;
		if ($ordersStore?.fetching) return;
		if (window.document.visibilityState !== 'visible') return;
		lastRefreshedAt = new Date();
		oldOrders = orders || [];
		ordersStore = queryStore({
			client,
			query,
			variables: {
				limit: isFiltered ? 1000 : $queryLimit,
				offset: isFiltered ? 0 : queryOffset,
				where: {
					id:
						idSearch && !orderReferenceSearch
							? {
									_in: idSearch
										.split(',')
										.map((v) => v.replace(/\D/g, ''))
										.filter((v) => !!v)
							  }
							: {},
					supplier_id: supplierSearch ? { _eq: supplierSearch } : {},
					jobs_orders: jobSearch
						? {
								job_id: {
									_in: jobSearch
										.split(',')
										.map((v) => v.replace(/\D/g, ''))
										.filter((v) => !!v)
								}
						  }
						: undefined,
					reference: orderReferenceSearch ? { _ilike: `%${orderReferenceSearch}%` } : {},
					user_id: buyerSearch ? { _eq: buyerSearch } : {},
					created_at: dateSearch?.[0] ? { _gte: dateSearch[0], _lte: `${dateSearch[0]}T23:59:59` } : {}
				}
			},
			requestPolicy: 'network-only'
		});

		console.log(
			'REFRESH @ ',
			lastRefreshedAt.toTimeString()?.split(' ')?.[0],
			oldOrders.length,
			ordersStore?.data?.erp_orders?.length
		);
	}
	const { pause, resume, isActive, changeIntervalTime } = intervalFnStore(() => {
		refresh();
	}, Number(localStorage.getItem('EAMES_orders_refreshInterval') || '15') * 1000);

	$: suppliersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query suppliers {
				erp_suppliers(order_by: { name: asc }) {
					id
					name
					names
					tags
					image_url
				}
			}
		`,
		variables: {}
	});
	$: suppliers = $suppliersStore?.data?.erp_suppliers || [];

	$: usersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query users {
				users(where: { orders_items_aggregate: { count: { predicate: { _gt: 0 } } } }, order_by: { username: asc }) {
					id
					username
					first_name
					last_name
				}
			}
		`,
		variables: {}
	});
	$: users = $usersStore?.data?.users || [];

	//$: orders = $ordersStore?.data?.erp_orders?.length ? $ordersStore?.data?.erp_orders : oldOrders;
	$: orders = $ordersStore?.fetching ? oldOrders : $ordersStore?.data?.erp_orders;

	const dispatch = createEventDispatcher();
	let openRows: number[] = [];
	function handleRowClick(idx: number, event: MouseEvent) {
		console.log('handleRowClick', idx, event);
		dispatch('row_click', { idx, event });
		if (getSelectionText()) return;
		if (openRows.includes(idx)) {
			openRows = openRows.filter((v) => v !== idx);
		} else {
			openRows = event.ctrlKey ? [...openRows, idx] : [idx];
		}
	}

	let collapsedColumns = storage(writable([]), 'EAMES_orders_collapsedColumns');

	let idRefSearch: string;
	let idSearch: string;
	let jobSearch: string;
	let categorySearch: string;
	let supplierSearch: string;
	let buyerSearch: string;
	//$: orderReferenceSearch = idSearch?.[0] === '#' ? idSearch?.substr(1) : undefined;
	let orderReferenceSearch: string;
	let dateSearch: string[] = ['', ''];
	$: console.log('date:', dateSearch[0] && new Date(dateSearch[0])?.toISOString());

	$: filtered = idRefSearch || jobSearch || categorySearch || supplierSearch || buyerSearch;

	onMount(() => {
		idSearch = decodeURIComponent($page.url.searchParams.get('id') || '');
		jobSearch = decodeURIComponent($page.url.searchParams.get('job') || '');
		supplierSearch = decodeURIComponent($page.url.searchParams.get('supplier') || '');
		if (!idSearch) {
			orderReferenceSearch = decodeURIComponent($page.url.searchParams.get('reference') || '');
		}

		if (idSearch) {
			idRefSearch = idSearch;
			orderReferenceSearch = '';
		} else if (orderReferenceSearch) {
			idRefSearch = '#' + orderReferenceSearch;
		} else {
		}

		buyerSearch = decodeURIComponent($page.url.searchParams.get('buyer') || '');
		if (buyerSearch === 'me') {
			if ($page?.data?.user?.id) {
				buyerSearch = $page?.data?.user?.id;
				replaceStateWithQuery({
					buyer: buyerSearch
				});
			}
		}

		dateSearch[0] = decodeURIComponent($page.url.searchParams.get('date') || '');
		if (dateSearch[0] === 'today') {
			dateSearch[0] = new Date().toISOString().split('T')[0];
			replaceStateWithQuery({
				date: dateSearch[0]
			});
		}

		$windowTitleStore = $page?.data?.orderId ? `Order | ${$page?.data?.orderId}` : 'Orders';
		return () => {
			$windowTitleStore = '';
		};
	});

	$: console.log(
		'QUERY:',
		$ordersStore,
		queryOffset,
		jobSearch
			? {
					job_id: {
						_in: jobSearch
							.split(',')
							.map((v) => v.replace(/\D/g, ''))
							.filter((v) => !!v)
					}
			  }
			: {}
	);
</script>

{#if $suppliersStore?.error}
	{JSON.stringify($suppliersStore.error)}
{/if}

{#if orderId}
	{#if $page?.data?.user?.processes && $page?.data?.user?.processes?.['purchase'] && $page?.data?.user?.processes?.['tester']}
		<OrderEditable {orderId} />
	{:else}
		<OrderOverview {orderId} />
	{/if}
{:else}
	<Table shadow hoverable>
		<TableHead>
			<TableHeadCollapsible columnId="id" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
				<input
					class="block w-24 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0"
					type="text"
					bind:value={idRefSearch}
					on:input={() => {
						if (idRefSearch?.[0] === '#') {
							idSearch = '';
							orderReferenceSearch = idRefSearch?.substr(1);
						} else {
							orderReferenceSearch = '';
							idSearch = idRefSearch;
						}
						replaceStateWithQuery({
							id: idSearch,
							reference: orderReferenceSearch
						});
					}}
				/>
				<Tooltip placement="bottom" defaultClass="py-1 px-1 text-xs font-medium">
					Start search with '#' to search by order reference (use '%' as wildcard)
				</Tooltip>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class:invisible={!idRefSearch}
					class="flex my-auto hover:text-red-600"
					on:click={() => {
						replaceStateWithQuery({
							id: '',
							reference: ''
						});
						idSearch = '';
						orderReferenceSearch = '';
						idRefSearch = '';
					}}
				>
					<XMark size="16" />
				</div>
			</TableHeadCollapsible>
			<TableHeadCollapsible columnId="job" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
				<input
					class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0"
					type="text"
					bind:value={jobSearch}
					on:input={() => {
						replaceStateWithQuery({
							job: jobSearch
						});
					}}
				/>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class:invisible={!jobSearch}
					class="flex my-auto hover:text-red-600"
					on:click={() => {
						replaceStateWithQuery({
							job: ''
						});
						jobSearch = '';
					}}
				>
					<XMark size="16" />
				</div>
			</TableHeadCollapsible>
			<TableHeadCollapsible columnId="buyer" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
				<select
					class="mx-auto w-fit block text-xs text-center disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0"
					bind:value={buyerSearch}
					on:change={() => {
						replaceStateWithQuery({
							buyer: buyerSearch
						});
					}}
				>
					<option value={''} />
					{#each users as user}
						<option value={user.id}>
							{user.first_name}
							{user.last_name}
						</option>
					{/each}
				</select>
				<div
					class:invisible={!buyerSearch}
					class="flex my-auto hover:text-red-600"
					on:click={() => {
						replaceStateWithQuery({
							buyer: ''
						});
						buyerSearch = '';
					}}
				>
					<XMark size="16" />
				</div>
			</TableHeadCollapsible>
			<TableHeadCollapsible columnId="category" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
				<!-- <input
					class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0"
					type="text"
					bind:value={categorySearch}
				/>
				<div
					class:invisible={!categorySearch}
					class="flex my-auto hover:text-red-600"
					on:click={() => (categorySearch = '')}
				>
					<XMark size="16" />
				</div>
				 -->
			</TableHeadCollapsible>
			<TableHeadCollapsible columnId="supplier" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
				<!-- <input
						class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded p-0.5"
						type="text"
						bind:value={supplierSearch}
					/> -->
				<select
					class="mx-auto w-fit block text-xs text-center disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0"
					bind:value={supplierSearch}
					on:change={() => {
						replaceStateWithQuery({
							supplier: supplierSearch
						});
					}}
				>
					<option value={''} />
					{#each suppliers as supplier}
						<option value={supplier.id}>
							{supplier.name}
						</option>
					{/each}
				</select>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class:invisible={!supplierSearch}
					class="flex my-auto hover:text-red-600"
					on:click={() => {
						replaceStateWithQuery({
							supplier: ''
						});
						supplierSearch = '';
					}}
				>
					<XMark size="16" />
				</div>
			</TableHeadCollapsible>
			<TableHeadCollapsible columnId="orderdate" bind:collapsedColumns={$collapsedColumns} showCollapseButton={false}>
				<input
					class="block w-28 text-xs disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0"
					type="date"
					bind:value={dateSearch[0]}
					on:change={() => {
						replaceStateWithQuery({
							date: dateSearch[0]
						});
					}}
				/>

				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class:invisible={!dateSearch[0]}
					class="flex my-auto hover:text-red-600"
					on:click={() => {
						replaceStateWithQuery({
							date: ''
						});
						dateSearch[0] = '';
					}}
				>
					<XMark size="16" />
				</div>
			</TableHeadCollapsible>
			<TableHeadCell colspan="3">
				<div class="flex">
					{#if $ordersStore?.error}
						<div class="ml-auto">
							<p class="text-red-600 font-bold">Query Error...</p>
						</div>
					{:else if !$ordersStore?.fetching && orders.length === 0}
						<div class="ml-auto">
							<p class="text-red-600 font-bold">No results...</p>
						</div>
					{/if}

					<div class="flex ml-auto">
						<div
							class:invisible={!isFiltered}
							class="flex my-auto hover:text-red-600 pr-1 outline-none cursor-pointer"
							on:click={() => {
								dateSearch[0] = '';
								idSearch = '';
								jobSearch = '';
								supplierSearch = '';
								buyerSearch = '';
							}}
						>
							<XMark size="16" />
						</div>
						<p class="mr-1">{orders?.length} result{orders?.length === 1 ? '' : 's'}</p>
						<svg
							on:click={() => {
								refresh();
							}}
							class:cursor-pointer={!$ordersStore?.fetching}
							class:animate-spin={$ordersStore?.fetching}
							class="w-4 h-4 text-gray-500 dark:text-white hover:text-gray-800 outline-none"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 18 20"
						>
							<path
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97"
							/>
						</svg>
						<Tooltip placement="left">
							<p class="text-xs">Last updated: {lastRefreshedAt?.toTimeString().split(' ')?.[0]}</p>
						</Tooltip>
					</div>
				</div>
			</TableHeadCell>
		</TableHead>
		<TableHead>
			<TableHeadCollapsible columnId="id" bind:collapsedColumns={$collapsedColumns}>PO#</TableHeadCollapsible>
			<TableHeadCollapsible columnId="job" bind:collapsedColumns={$collapsedColumns}>Jobs</TableHeadCollapsible>
			<TableHeadCollapsible columnId="buyer" bind:collapsedColumns={$collapsedColumns}>Buyer</TableHeadCollapsible>
			<TableHeadCollapsible columnId="category" bind:collapsedColumns={$collapsedColumns}>Categories</TableHeadCollapsible>
			<TableHeadCollapsible columnId="supplier" bind:collapsedColumns={$collapsedColumns}>Supplier</TableHeadCollapsible>
			<TableHeadCollapsible columnId="orderdate" bind:collapsedColumns={$collapsedColumns}>Created</TableHeadCollapsible>
			<TableHeadCollapsible columnId="items" bind:collapsedColumns={$collapsedColumns}>Items</TableHeadCollapsible>
			<TableHeadCollapsible columnId="total" bind:collapsedColumns={$collapsedColumns}>Total</TableHeadCollapsible>
			<TableHeadCollapsible columnId="status" bind:collapsedColumns={$collapsedColumns}>Status</TableHeadCollapsible>
		</TableHead>

		<TableBody>
			{#each orders || [] as order, idx}
				{@const ordersTotalQty = order?.orders_items_aggregate?.aggregate?.sum?.quantity}
				{@const ordersTotalReceivedQty = order?.orders_items?.reduce(
					(a, v) => a + v.orders_items_receiveds_aggregate?.aggregate?.sum?.quantity,
					0
				)}
				{@const categories = order?.orders_items
					?.map((oi) => oi?.category || 'Unknown')
					?.filter((v, i, a) => a.indexOf(v) === i)}
				<TableBodyRow color={'default'} class={``}>
					{@const jobsOrders = order?.jobs_orders || []}
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="id"
						bind:collapsedColumns={$collapsedColumns}
					>
						<a
							class="flex cursor-pointer"
							href={`${window.origin}/order/${order?.id}`}
							target="_blank"
							on:click|preventDefault={(e) => {
								handleRowClick(idx, e);
							}}
						>
							<div class="my-auto pr-1">
								{#if openRows?.includes(idx)}
									<ChevronDown size="20" />
								{:else}
									<ChevronRight size="20" />
								{/if}
							</div>
							<div>
								<p class={classes.link}>
									{padString(String(order?.id))}
								</p>
								{#if order?.reference}
									<p class="text-xs italic">
										#{order.reference}
									</p>
								{/if}
							</div>
						</a>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="job"
						bind:collapsedColumns={$collapsedColumns}
					>
						<div class="w-fit flex flex-wrap text-xs gap-1">
							{#each jobsOrders || [] as jo}
								<!-- <a href={`${window.origin}/receiving/${jo?.job?.id}`} target="_blank"> -->
								<div
									class="cursor-pointer"
									on:click={(e) => {
										jobSearch = jobSearch === String(jo?.job?.id) ? '' : String(jo?.job?.id);
										replaceStateWithQuery({
											job: jobSearch
										});
									}}
								>
									<Badge color="blue">{jo?.job?.id}</Badge>
								</div>
								<!-- </a> -->
							{:else}
								<div class="cursor-default">
									<Badge color="dark">N/A</Badge>
								</div>
							{/each}
						</div>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="buyer"
						bind:collapsedColumns={$collapsedColumns}
					>
						<div
							on:click={(e) => {
								buyerSearch = order?.user?.id;
								replaceStateWithQuery({
									buyer: buyerSearch
								});
							}}
						>
							<UserIcon size="xs" user={order?.user} buttonClass="!p-0 !pr-2 text-white">
								{order?.user?.first_name}
								{order?.user?.last_name}
							</UserIcon>
						</div>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="category"
						bind:collapsedColumns={$collapsedColumns}
					>
						<div class="w-fit flex flex-wrap text-xs gap-1">
							{#each categories || [] as category}
								<div>
									<Badge color="blue">{category}</Badge>
								</div>
							{:else}
								<div>
									<Badge color="blue">Unknown</Badge>
								</div>
							{/each}
						</div>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="supplier"
						bind:collapsedColumns={$collapsedColumns}
					>
						<p class={classes.popover}>{order?.supplier?.name}</p>
						<Popover placement="left">
							<SupplierInfo supplierId={order?.supplier?.id} />
						</Popover>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="orderdate"
						bind:collapsedColumns={$collapsedColumns}
					>
						<p>{datetimeFormat(order?.created_at)}</p>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="items"
						bind:collapsedColumns={$collapsedColumns}
					>
						<p>{order?.orders_items_aggregate?.aggregate?.count}</p>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="total"
						bind:collapsedColumns={$collapsedColumns}
					>
						<p>
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(order?.orders_items?.reduce((a, v) => a + v.price * v.quantity, 0))}
						</p>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-6 py-1 whitespace-nowrap font-medium"
						columnId="status"
						bind:collapsedColumns={$collapsedColumns}
					>
						<a href={`${window.origin}/receiving/PO${order?.id}`} target="_blank" class="flex">
							{#if ordersTotalReceivedQty >= ordersTotalQty || order?.received_at}
								<img
									style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/windows/32/unpacking.png"
									alt="unpacking"
								/>
								<p class="font-semibold pt-1 pl-2 uppercase text-xs">Received</p>
							{:else if ordersTotalReceivedQty === 0}
								<img
									style="filter: brightness(0) saturate(10%) invert(30%) sepia(97%) saturate(600%) hue-rotate(350deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/windows/32/unpacking.png"
									alt="unpacking"
								/>
								<p class="font-semibold pt-1 pl-2 uppercase text-xs">Not Received</p>
							{:else if ordersTotalReceivedQty < ordersTotalQty}
								<img
									style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(350deg)"
									width="24"
									height="24"
									src="https://img.icons8.com/windows/32/unpacking.png"
									alt="unpacking"
								/>
								<p class="font-semibold pt-1 pl-2 uppercase text-xs">Partially Received</p>
							{/if}
						</a>
					</TableBodyCollapsible>
				</TableBodyRow>
				{#if openRows?.includes(idx)}
					<TableBodyRow class="h-24 ">
						<TableBodyCell colspan="9" class="p-0">
							<div class="px-1 py-1 mx-auto">
								<OrderDetailTable orderIds={[order.id]} hiddenColumns={['supplier']} />
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/if}
			{:else}
				<TableBodyRow class="h-24">
					<TableBodyCell colspan="9" class="p-0">
						<p>No orders matching search criteria</p>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
		<TableHead>
			{#if !filtered}
				<TableHeadCell
					on:click={() => {
						/* if (!queryOffset) {
					queryOffset = orders?.[0]?.id;
				} */
						oldOrders = orders;
						queryOffset = Math.max(queryOffset - $queryLimit, 0);
					}}
				>
					<div class={'flex cursor-point' + classes.link}><ChevronLeft size="16" />Prev {$queryLimit}</div>
				</TableHeadCell>
			{:else}
				<TableHeadCell />
			{/if}

			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell>
				<p>
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: 'GBP'
					}).format(
						orders
							?.flatMap((o) => o?.orders_items?.reduce((a, v) => a + v.price * v.quantity, 0))
							?.reduce((a, v) => a + v, 0)
					)}
				</p>
			</TableHeadCell>
			{#if !filtered}
				<TableHeadCell
					on:click={() => {
						/* if (!queryOffset) {
					queryOffset = orders?.[0]?.id;
				} */
						oldOrders = orders;
						queryOffset += $queryLimit;
					}}
				>
					<div class={'flex cursor-point float-right' + classes.link}>Next {$queryLimit} <ChevronRight size="16" /></div>
				</TableHeadCell>
			{:else}
				<TableHeadCell />
			{/if}
		</TableHead>
	</Table>
{/if}
