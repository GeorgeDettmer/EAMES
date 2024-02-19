<script lang="ts">
	import { page } from '$app/stores';
	import { getContextClient, gql, queryStore, type OperationResultStore } from '@urql/svelte';
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
	import { ChevronDown, ChevronLeft, ChevronRight, XMark, Minus } from 'svelte-heros-v2';
	import TableBodyCollapsible from '$lib/components/Misc/Table/TableBodyCollapsible.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { classes, datetimeFormat, getSelectionText, numberToLetter, padString, replaceStateWithQuery } from '$lib/utils';
	import OrderStatus from '$lib/components/Orders/OrderStatus.svelte';
	import { windowTitleStore } from '$lib/stores';
	import SupplierInfo from '$lib/components/Supplier/SupplierInfo.svelte';
	import type { PageData } from './$types';
	import moment from 'moment';

	export let data: PageData;

	$: jobId = $page?.data?.jobId;
	let client = getContextClient();
	let query = gql`
		query orders($where: erp_orders_bool_exp, $limit: Int = 100, $offset: Int = 0) {
			erp_orders(order_by: { created_at: desc, id: desc }, limit: $limit, offset: $offset, where: $where) {
				id
				reference
				created_at
				total
				items
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
							quantity
						}
					}
				}
				orders_items {
					category
					orders_items_receiveds_aggregate {
						aggregate {
							sum {
								quantity
							}
						}
					}
					jobs_allocations {
						job_id
						job_batch
					}
					orders_items_shipments {
						id
						shipment {
							id
							confirmed_delivery_date
						}
					}
				}
				supplier {
					id
					name
					tags
					risk_level
					critical
					approved
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
	let queryLimit = storage(writable(200), 'EAMES_jobs_limit');
	let jobsStore: OperationResultStore;
	//TODO: Clap upper limit of offset so as not to go past last id...
	//TODO: If filter applied adjust offset?
	$: if (!jobId) {
		jobsStore = queryStore({
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
					orders_items: jobSearch
						? {
								jobs_allocations: {
									job_id: {
										_in: jobSearch
											.split(',')
											.map((v) => v.replace(/\D/g, ''))
											.filter((v) => !!v)
									}
								}
						  }
						: undefined,
					reference: orderReferenceSearch ? { _ilike: `%${orderReferenceSearch}%` } : {},
					user_id: buyerSearch ? { _eq: buyerSearch } : {},
					created_at: dateSearch?.[0]
						? {
								_gte: dateSearch[0],
								_lte: `${dateSearch?.[1] ? dateSearch?.[1] : dateSearch[0]}T23:59:59`
						  }
						: {}
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

	let lastRefreshedAt: Date;
	let oldOrders: string | any[] = [];
	async function refresh() {
		if (jobId) return;
		if ($jobsStore?.fetching) return;
		if (window.document.visibilityState !== 'visible') return;
		lastRefreshedAt = new Date();
		oldOrders = orders || [];
		jobsStore = queryStore({
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
					orders_items: jobSearch
						? {
								jobs_allocations: {
									job_id: {
										_in: jobSearch
											.split(',')
											.map((v) => v.replace(/\D/g, ''))
											.filter((v) => !!v)
									}
								}
						  }
						: undefined,
					reference: orderReferenceSearch ? { _ilike: `%${orderReferenceSearch}%` } : {},
					user_id: buyerSearch ? { _eq: buyerSearch } : {},
					created_at: dateSearch?.[0]
						? {
								_gte: dateSearch[0],
								_lte: `${dateSearch?.[1] ? dateSearch?.[1] : dateSearch[0]}T23:59:59`
						  }
						: {}
				}
			},
			requestPolicy: 'network-only'
		});
		if (!isActive) resume();
		console.log(
			'REFRESH @ ',
			lastRefreshedAt.toTimeString()?.split(' ')?.[0],
			oldOrders.length,
			$jobsStore?.data?.erp_orders?.length
		);
	}

	const { pause, resume, isActive, changeIntervalTime } = intervalFnStore(() => {
		if ($jobsStore?.error) {
			console.error('QUERY ERROR: Error refreshing orders', $jobsStore?.error?.message, $jobsStore?.error);
			pause();
			return;
		}
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
	$: orders = $jobsStore?.fetching ? oldOrders : $jobsStore?.data?.erp_orders;

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

		if (dateSearch[0]) {
			dateSearch[1] = decodeURIComponent($page.url.searchParams.get('dateEnd') || '');
			if (dateSearch[1] === 'today') {
				dateSearch[1] = new Date().toISOString().split('T')[0];
				replaceStateWithQuery({
					dateEnd: dateSearch[1]
				});
			}
		}

		return () => {
			$windowTitleStore = '';
		};
	});
	$: $windowTitleStore = $page?.data?.jobId ? `Job | ${$page?.data?.jobId}` : 'Jobs';
	$: console.log(
		'QUERY:',
		$jobsStore,
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
	$: ({ jobs, config } = data);
	$: console.log('data', jobs, data);
</script>

{#if $suppliersStore?.error}
	{JSON.stringify($suppliersStore.error)}
{/if}

{#if jobId}
	{jobId}
{:else}
	<Table shadow hoverable>
		<TableHead>
			<TableHeadCell padding="px-1 py-3" />
		</TableHead>
		<TableHead>
			<TableHeadCell padding="px-1 py-3" />
			<TableHeadCell padding="px-1 py-3">JOB#</TableHeadCell>
			<TableHeadCollapsible padding="px-1 py-3" columnId="batch" bind:collapsedColumns={$collapsedColumns}
				>Batch</TableHeadCollapsible
			>
			<TableHeadCollapsible padding="px-1 py-3" columnId="customer" bind:collapsedColumns={$collapsedColumns}
				>Customer</TableHeadCollapsible
			>
			<TableHeadCollapsible padding="px-1 py-3" columnId="quantity" bind:collapsedColumns={$collapsedColumns}
				>Quantity</TableHeadCollapsible
			>
			<TableHeadCollapsible padding="px-1 py-3" columnId="assembly" bind:collapsedColumns={$collapsedColumns}
				>Assembly</TableHeadCollapsible
			>
			<TableHeadCollapsible padding="px-1 py-3" columnId="duedate" bind:collapsedColumns={$collapsedColumns}
				>Due Date</TableHeadCollapsible
			>
			<!-- <TableHeadCollapsible padding="px-1 py-3" columnId="items" bind:collapsedColumns={$collapsedColumns}
				>Items</TableHeadCollapsible
			>
			<TableHeadCollapsible padding="px-1 py-3" columnId="total" bind:collapsedColumns={$collapsedColumns}
				>Total</TableHeadCollapsible
			>
			<TableHeadCollapsible padding="px-1 py-3" columnId="status" bind:collapsedColumns={$collapsedColumns}
				>Status</TableHeadCollapsible
			> -->
		</TableHead>

		<TableBody>
			{#each jobs || [] as job, idx}
				<TableBodyRow color={job?.batch > 0 ? 'default' : 'default'}>
					<TableBodyCell tdClass="px-1 whitespace-nowrap font-medium">
						{#if job?.batch === 0}
							<button
								class="my-auto cursor-pointer"
								on:click|preventDefault={(e) => {
									handleRowClick(idx, e);
								}}
							>
								{#if openRows?.includes(idx)}
									<ChevronDown size="21" />
								{:else}
									<ChevronRight size="21" />
								{/if}
							</button>
						{:else}
							<Minus size="21" />
						{/if}
					</TableBodyCell>
					<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
						<div class="flex gap-x-1">
							<p class="italic text-gray-500">{config?.job_prefix || ''}</p>
							<a href={`job/${job?.id}`} class={classes.link}>
								{job?.id}
							</a>
						</div>
					</TableBodyCell>
					<TableBodyCollapsible
						tdClass="px-1 py-1 whitespace-nowrap font-medium"
						columnId="batch"
						bind:collapsedColumns={$collapsedColumns}
					>
						{#if job?.batch > 0}
							<Badge color="blue">
								{numberToLetter(job.batch - 1)}
							</Badge>
						{:else}
							<!-- <Badge color="dark">N/A</Badge> -->
						{/if}
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-1 py-1 whitespace-nowrap font-medium"
						columnId="customer"
						bind:collapsedColumns={$collapsedColumns}
					>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<button
							on:click={(e) => {
								/* supplierSearch = supplierSearch ? '' : job?.supplier?.id;
								replaceStateWithQuery({
									supplier: supplierSearch
								}); */
							}}
						>
							<Badge color="blue">
								{job.customer?.name}
							</Badge>
						</button>
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-1 py-1 max-w-48 whitespace-nowrap font-medium"
						columnId="quantity"
						bind:collapsedColumns={$collapsedColumns}
					>
						{job?.quantity || 0}
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-1 py-1 whitespace-nowrap font-medium"
						columnId="assembly"
						bind:collapsedColumns={$collapsedColumns}
					>
						<button
							on:click={(e) => {
								/* supplierSearch = supplierSearch ? '' : job?.supplier?.id;
								replaceStateWithQuery({
									supplier: supplierSearch
								}); */
							}}
						>
							<Badge border={!job?.assembly?.name} color={!job?.assembly?.name ? 'red' : 'blue'}>
								<p>
									<span class={classes.popover}>{job?.assembly?.name}</span>
									<span>| {job?.assembly?.revision_external}</span>
								</p>
							</Badge>
						</button>
						<Popover placement="left">
							<p>Assembly info...</p>
						</Popover>
						{#if job?.supplier?.approved === false}
							<Badge color="red" rounded>
								<p class="text-xs font-bold uppercase">!</p>
							</Badge>
							<Tooltip defaultClass="py-1 px-2 text-sm font-medium" placement="right">Unapproved Supplier</Tooltip>
						{/if}
					</TableBodyCollapsible>
					<TableBodyCollapsible
						tdClass="px-1 py-1 whitespace-nowrap font-medium"
						columnId="duedate"
						bind:collapsedColumns={$collapsedColumns}
					>
						{@const daysUntilDue = (Date.now() - new Date(job?.due_date).getTime()) / 1000 / 60 / 60 / 24}
						<Badge color={daysUntilDue < 2 ? 'red' : daysUntilDue < 5 ? 'yellow' : 'blue'}>
							<div class="text-xs -space-y-1">
								{#if job?.due_date}
									<p>{datetimeFormat(job?.due_date, false)}</p>
									<p class="italic text-right">
										{moment(job?.due_date).fromNow()}
									</p>
								{:else}
									N/A
								{/if}
							</div>
						</Badge>
					</TableBodyCollapsible>
				</TableBodyRow>
				{#if openRows?.includes(idx)}
					<TableBodyRow>
						<TableBodyCell />
						<TableBodyCell colspan="3" tdClass="p-0" />
						<TableBodyCell colspan="1" tdClass="p-0" />
						<TableBodyCell tdClass="py-1">
							<!-- <SupplierInfo supplierId={job.supplier.id} /> -->
						</TableBodyCell>
						<TableBodyCell colspan="4" tdClass="p-0" />
					</TableBodyRow>
					<TableBodyRow class="h-24">
						<TableBodyCell colspan="7" tdClass="p-0">
							<div class="">
								<!-- <OrderDetailTable orderIds={[order.id]} hiddenColumns={['supplier']} /> -->
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/if}
			{:else}
				<TableBodyRow class="h-24">
					<TableBodyCell colspan="10" class="p-0">
						{#if $jobsStore?.fetching}
							<p class="animate-pulse">Loading...</p>
						{:else if $jobsStore?.error}
							<p class="text-red-600">Error: {$jobsStore?.error?.message}</p>
						{:else}
							<p>No orders matching search criteria</p>
						{/if}
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
		<TableHead>
			{#if !filtered}
				<TableHeadCell
					colspan="2"
					on:click={() => {
						oldOrders = orders;
						queryOffset = Math.max(queryOffset - $queryLimit, 0);
					}}
				>
					<div class={'flex cursor-point' + classes.link}><ChevronLeft size="16" />Prev {$queryLimit}</div>
				</TableHeadCell>
			{:else}
				<TableHeadCell colspan="2" />
			{/if}
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell>
				<p>
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: 'GBP'
					}).format(orders?.reduce((a, o) => a + (o?.total || 0), 0))}
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
