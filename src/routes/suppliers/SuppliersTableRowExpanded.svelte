<script lang="ts">
	import type { Supplier } from '$lib/types';
	import {
		TableBodyRow,
		TableBodyCell,
		Hr,
		TableHeadCell,
		Table,
		TableHead,
		TableBody,
		Card,
		Listgroup
	} from 'flowbite-svelte';
	import SupplierInfo from '$lib/components/Supplier/SupplierInfo.svelte';
	import { getContextClient, gql, queryStore, subscriptionStore } from '@urql/svelte';
	import { classes } from '$lib/utils';
	import { EnvelopeOutline, PhoneOutline } from 'flowbite-svelte-icons';

	export let supplier: Supplier;

	$: supplierStore = queryStore({
		client: getContextClient(),
		query: gql`
			query supplier($id: String!) {
				erp_suppliers_by_pk(id: $id) {
					id
					name
					names
					created_at
					risk_level
					tags
					approved
					critical
					image_url
					user {
						username
						color
						first_name
						last_name
						initials
						id
					}
					userByApprovedUserId {
						username
						color
						first_name
						last_name
						initials
						id
					}
					orders(order_by: { created_at: desc }, limit: 25) {
						id
						items
						total
						user {
							id
							first_name
							last_name
							initials
							color
							username
						}
					}
				}
			}
		`,
		variables: { id: supplier.id }
	});
	$: supplierInfo = $supplierStore?.data?.erp_suppliers_by_pk || supplier;

	let supplierPeriodAggregationsStore;
	$: supplierPeriodAggregationsStore = queryStore({
		client: getContextClient(),
		query: gql`
			query supplier($id: String!, $_where: erp_orders_bool_exp = {}) {
				erp_suppliers_by_pk(id: $id) {
					orders_aggregate(where: $_where) {
						aggregate {
							count
							max {
								created_at
							}
							min {
								created_at
							}
							sum {
								total
								items
							}
							avg {
								total
								items
							}
						}
					}
				}
			}
		`,
		variables: {
			id: supplier.id,
			_where: supplierSummaryPeriodDays
				? { created_at: { _gte: new Date(Date.now() - supplierSummaryPeriodDays * 24 * 60 * 60 * 1000).toISOString() } }
				: {}
		},
		requestPolicy: 'cache-and-network'
	});
	$: supplierPeriodAggregations = $supplierPeriodAggregationsStore?.data?.erp_suppliers_by_pk;
	$: console.log(supplierInfo, supplierPeriodAggregations);

	let supplierSummaryPeriodDaysList: [string, number][] = [
		['1D', 1],
		['1W', 7],
		['2W', 14],
		['1M', 30],
		['2M', 60],
		['3M', 90],
		['6M', 180],
		['1Y', 365]
	];
	let supplierSummaryPeriodDays: number | undefined = undefined;
</script>

<TableBodyRow>
	<TableBodyCell tdClass="px-0 py-1" />
	<TableBodyCell colspan="2" tdClass="py-1">
		<div class=" space-y-2">
			<SupplierInfo supplier={supplierInfo} />
			<Table>
				<TableHead>
					<TableHeadCell padding="px-1 py-0">
						<select
							class="text-xs border-gray-300 dark:border-gray-600 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400 rounded px-0.5 py-0.5"
							bind:value={supplierSummaryPeriodDays}
						>
							<option value={undefined}>~</option>
							{#each supplierSummaryPeriodDaysList as [period, days]}
								<option value={days}>{period}</option>
							{/each}
						</select>
					</TableHeadCell>
					<TableHeadCell padding="px-1 py-0">Total</TableHeadCell>
					<TableHeadCell padding="px-1 py-0">Avg</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow>
						<TableBodyCell tdClass="px-1 py-0.5 bg-gray-50 dark:bg-gray-700 uppercase font-bold text-xs text-right"
							>Value</TableBodyCell
						>
						<TableBodyCell tdClass="px-1 py-0.5 min-w-20">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(supplierPeriodAggregations?.orders_aggregate?.aggregate?.sum?.total || 0)}
						</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-0.5 min-w-20">
							{new Intl.NumberFormat('en-GB', {
								style: 'currency',
								currency: 'GBP'
							}).format(supplierPeriodAggregations?.orders_aggregate?.aggregate?.avg?.total || 0)}
						</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell tdClass="px-1 py-0.5 bg-gray-50 dark:bg-gray-700 uppercase font-bold text-xs text-right"
							>Items</TableBodyCell
						>
						<TableBodyCell tdClass="px-1 py-0.5 min-w-20">
							{supplierPeriodAggregations?.orders_aggregate?.aggregate?.sum?.items || 0}
						</TableBodyCell>
						<TableBodyCell tdClass="px-1 py-0.5 min-w-20">
							{Math.round(supplierPeriodAggregations?.orders_aggregate?.aggregate?.avg?.items || 0)}
						</TableBodyCell>
					</TableBodyRow>
				</TableBody>
			</Table>
		</div>
	</TableBodyCell>
	<TableBodyCell colspan="3" tdClass="p-0">
		<div class="m-1 p-2 border rounded border-gray-500 h-36">
			<div class="flex justify-between items-center mb-1">
				<h5 class="text-lg font-bold leading-none text-gray-900 dark:text-white">Addresses</h5>
			</div>
			<ul class="divide-y divide-gray-200 dark:divide-gray-600">
				{#each supplier?.addresses || [] as address}
					{@const lines = address?.lines?.split(',')}
					{@const mapsUrl = 'https://maps.google.com/?q=' + encodeURI([...address.lines, ', ', address.country].join(''))}
					<li>
						<div class="flex items-center space-x-4 rtl:space-x-reverse">
							<div class="flex-1 min-w-0">
								<a href={mapsUrl} target="_blank" class="hover:underline">
									<p class="text-xs font-medium text-gray-900 truncate dark:text-white">
										{address?.country}
									</p>
									{#each lines as line}
										<p class="text-xs text-gray-500 truncate dark:text-gray-400">
											{line}
										</p>
									{/each}
								</a>
								<!-- {#if address?.email}
									<a href="mailto:{address.email}" class="text-xs text-gray-500 truncate dark:text-gray-400">
										{address.email}
									</a>
								{/if} -->
							</div>
							{#if address?.note}
								<div class="inline-flex items-centerfont-semibold text-gray-900 dark:text-white">
									{address.note}
								</div>
							{/if}
						</div>
					</li>
				{:else}
					<li>
						<div class="flex items-center space-x-4 rtl:space-x-reverse">
							<div class="flex-1 min-w-0">
								<p class="text-xs font-medium text-gray-900 truncate dark:text-white">No addresses</p>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</TableBodyCell>
	<TableBodyCell colspan="3" tdClass="p-0">
		<div class="m-1 p-2 border rounded border-gray-500 h-36">
			<div class="flex justify-between items-center mb-1">
				<h5 class="text-lg font-bold leading-none text-gray-900 dark:text-white">Contacts</h5>
			</div>
			<ul class="divide-y divide-gray-200 dark:divide-gray-600">
				{#each supplier?.contacts || [] as contact}
					<li>
						<div class="flex items-center space-x-4 rtl:space-x-reverse">
							<div class="flex-1 min-w-0">
								<p class="text-xs font-medium text-gray-900 truncate dark:text-white">
									{contact?.name}
								</p>
								{#if contact?.email}
									<div class="flex space-x-1">
										<div class="my-auto">
											<EnvelopeOutline size="xs" />
										</div>
										<a
											href="mailto:{contact.email}"
											class="text-xs text-gray-500 truncate dark:text-gray-400 hover:underline"
										>
											{contact.email}
										</a>
									</div>
								{/if}
								{#if contact?.phone}
									<div class="flex space-x-1">
										<div class="my-auto">
											<PhoneOutline size="xs" />
										</div>
										<p class="text-xs text-gray-500 truncate dark:text-gray-400 hover:underline">
											{contact.phone}
										</p>
									</div>
								{/if}
							</div>
							{#if contact?.note}
								<div class="inline-flex items-centerfont-semibold text-gray-900 dark:text-white">
									{contact.note}
								</div>
							{/if}
						</div>
					</li>
				{:else}
					<li>
						<div class="flex items-center space-x-4 rtl:space-x-reverse">
							<div class="flex-1 min-w-0">
								<p class="text-xs font-medium text-gray-900 truncate dark:text-white">No contacts</p>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</TableBodyCell>
	<TableBodyCell colspan="4" tdClass="p-0">
		<div
			class="h-36 overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-400 dark:scrollbar-thumb-gray-400 dark:scrollbar-track-gray-700"
		>
			<Table>
				<TableHead>
					<TableHeadCell padding="px-1 py-1">Order#</TableHeadCell>
					<TableHeadCell padding="px-1 py-1">Items</TableHeadCell>
					<TableHeadCell padding="px-1 py-1">Total</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each supplierInfo?.orders || [] as order}
						<TableBodyRow>
							<TableBodyCell tdClass="py-0.5">
								<a href={'/order/' + order.id} class={classes.link}>{order.id}</a>
							</TableBodyCell>
							<TableBodyCell tdClass="py-0.5">
								{order?.items || 0}
							</TableBodyCell>
							<TableBodyCell tdClass="py-0.5">
								{new Intl.NumberFormat('en-GB', {
									style: 'currency',
									currency: 'GBP'
								}).format(order.total)}
							</TableBodyCell>
						</TableBodyRow>
					{:else}
						<TableBodyRow colspan="3">
							<TableBodyCell>No orders...</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	</TableBodyCell>
	<TableBodyCell colspan="1" tdClass="p-0" />
</TableBodyRow>
