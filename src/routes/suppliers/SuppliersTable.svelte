<script lang="ts">
	import type { Supplier } from '$lib/types';
	import { datetimeFormat, getSelectionText } from '$lib/utils';
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { EditOutline } from 'flowbite-svelte-icons';
	import moment from 'moment';
	import SupplierInfo from '$lib/components/Supplier/SupplierInfo.svelte';
	import SuppliersTableRow from './SuppliersTableRow.svelte';
	import { ChevronDown, ChevronRight } from 'svelte-heros-v2';
	import SuppliersTableRowExpanded from './SuppliersTableRowExpanded.svelte';

	export let suppliers: Supplier[] = [];
	export let allowEdit: boolean = false;
	export let openRowsIdx: number[] = [];
	export let openRowsId: string[] = [];

	function toggleExpandRow(idx: number, id: string = '', e: MouseEvent) {
		/* if (getSelectionText()) return; */
		e.preventDefault();
		if (openRowsIdx?.includes(idx) || openRowsId?.includes(id)) {
			openRowsIdx = openRowsIdx.filter((i) => i !== idx);
			openRowsId = openRowsId.filter((i) => i !== id);
		} else {
			openRowsIdx = e.ctrlKey ? [...openRowsIdx, idx] : [idx];
			if (id) {
				openRowsId = e.ctrlKey ? [...openRowsId, id] : [id];
			}
		}
	}
</script>

<Table>
	<TableHead>
		<TableHeadCell padding="px-1 py-3" />
		<TableHeadCell padding="px-1 py-3">ID</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Name</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Type</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Status</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Identifiers</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Risk Level</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Categories</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Tags</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Created at</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Created by</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Last Used</TableHeadCell>
		<TableHeadCell padding="px-1 py-3">Orders</TableHeadCell>
		{#if allowEdit}
			<TableHeadCell padding="px-1 py-3" />
		{/if}
	</TableHead>
	<TableBody>
		{#each suppliers as supplier, idx}
			{@const rowExpanded = openRowsIdx?.includes(idx) || openRowsId?.includes(supplier?.id)}
			<SuppliersTableRow {supplier} {idx}>
				<span slot="start">
					<TableBodyCell tdClass="px-1 whitespace-nowrap font-medium">
						<button
							class="my-auto cursor-pointer"
							on:click|preventDefault={(e) => {
								toggleExpandRow(idx, supplier?.id, e);
							}}
						>
							{#if rowExpanded}
								<ChevronDown size="22" />
							{:else}
								<ChevronRight size="22" />
							{/if}
						</button>
					</TableBodyCell>
				</span>
				<div slot="end">
					{#if allowEdit}
						<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap font-medium">
							<EditOutline
								size="sm"
								on:click={() => {
									console.log('Supplier,edit', { idx, supplier });
									/* editSupplier = supplier;
                                        editModal = true; */
								}}
							/>
						</TableBodyCell>
					{/if}
				</div>
			</SuppliersTableRow>
			{#if rowExpanded}
				<SuppliersTableRowExpanded {supplier} />
			{/if}
		{/each}
	</TableBody>
	<TableHead>
		<TableHeadCell>{suppliers?.length}</TableHeadCell>
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell />
		<TableHeadCell>{suppliers?.reduce((a, v) => a + v?.orders_aggregate?.aggregate?.count || 0, 0)}</TableHeadCell>
		{#if allowEdit}
			<TableHeadCell />
		{/if}
	</TableHead>
</Table>
