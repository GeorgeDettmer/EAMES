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
	import JobsTableRow from './JobsTableRow.svelte';
	import JobsTableRowExpanded from './JobsTableRowExpanded.svelte';

	export let data: PageData;

	$: jobId = $page?.data?.jobId;

	let lastRefreshedAt: Date;
	async function refresh() {}

	const { pause, resume, isActive, changeIntervalTime } = intervalFnStore(() => {
		refresh();
	}, Number(localStorage.getItem('EAMES_orders_refreshInterval') || '15') * 1000);

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

	let collapsedColumns = storage(writable([]), 'EAMES_jobs_collapsedColumns');

	onMount(() => {
		return () => {
			$windowTitleStore = '';
		};
	});
	$: $windowTitleStore = $page?.data?.jobId ? `Job | ${$page?.data?.jobId}` : 'Jobs';
	$: ({ jobs, config } = data);

	let filtered = false;
</script>

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
			<TableHeadCollapsible padding="px-1 py-3" columnId="batch" bind:collapsedColumns={$collapsedColumns}>
				Batch
			</TableHeadCollapsible>
			<TableHeadCollapsible padding="px-1 py-3" columnId="customer" bind:collapsedColumns={$collapsedColumns}>
				Customer
			</TableHeadCollapsible>
			<TableHeadCollapsible padding="px-1 py-3" columnId="reference" bind:collapsedColumns={$collapsedColumns}>
				Reference
			</TableHeadCollapsible>
			<TableHeadCollapsible padding="px-1 py-3" columnId="quantity" bind:collapsedColumns={$collapsedColumns}>
				Quantity
			</TableHeadCollapsible>
			<TableHeadCollapsible padding="px-1 py-3" columnId="assembly" bind:collapsedColumns={$collapsedColumns}>
				Assembly
			</TableHeadCollapsible>
			<TableHeadCollapsible padding="px-1 py-3" columnId="duedate" bind:collapsedColumns={$collapsedColumns}>
				Due Date
			</TableHeadCollapsible>
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
				<JobsTableRow {job} jobPrefix={config?.job_prefix || ''}>
					<span slot="start">
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
					</span>
					<span slot="end" />
				</JobsTableRow>
				{#if openRows?.includes(idx)}
					<JobsTableRowExpanded {job} />
				{/if}
			{:else}
				<TableBodyRow class="h-24">
					<TableBodyCell colspan="10" class="p-0">
						<!-- {#if $jobsStore?.fetching}
							<p class="animate-pulse">Loading...</p>
						{:else if $jobsStore?.error}
							<p class="text-red-600">Error: {$jobsStore?.error?.message}</p>
						{:else}
							<p>No jobs matching search criteria</p>
						{/if} -->
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
		<TableHead>
			{#if !filtered}
				<TableHeadCell
					colspan="2"
					on:click={() => {
						/* oldOrders = orders;
						queryOffset = Math.max(queryOffset - $queryLimit, 0) */
					}}
				>
					<!--<div class={'flex cursor-point' + classes.link}><ChevronLeft size="16" />Prev {$queryLimit}</div>-->
				</TableHeadCell>
			{:else}
				<TableHeadCell colspan="2" />
			{/if}
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell />
			<TableHeadCell />
			<!-- {#if !filtered}
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
			{:else} -->
			<TableHeadCell />
			<!-- {/if} -->
		</TableHead>
	</Table>
{/if}
