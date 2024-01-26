<script lang="ts">
	import { classes, datetimeFormat } from '$lib/utils';
	import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Tooltip } from 'flowbite-svelte';
	import UserIcon from '../UserIcon.svelte';

	export let shipmentAllocations = [];
</script>

<Table>
	<TableHead theadClass="text-xs uppercase text-center">
		<TableHeadCell padding="px-1 py-1">#</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Order</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">User</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Category</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">PN</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">SPN</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Order Qty</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Shipment Qty</TableHeadCell>
	</TableHead>
	<TableBody>
		{#each shipmentAllocations || [] as ois, idx}
			{@const item = ois.orders_item}
			<TableBodyRow>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<p class={'uppercase'}>
						{idx + 1}
					</p>
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<a href={`${window.origin}/order/${item?.order_id}`} target="_blank" class={classes.link}>
						{item?.order_id}
					</a>
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<UserIcon size="xs" user={item?.user} buttonClass="!p-0 !pr-2 text-white" />
					<Tooltip placement="right">
						<p>
							{#if item?.user?.first_name}
								{item?.user?.first_name}
								{item?.user?.last_name}
							{:else}
								Unknown user...
							{/if}
						</p>
						<p>{datetimeFormat(item.updated_at)}</p>
					</Tooltip>
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{item?.category || 'Unknown'}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{item.part}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{item.spn}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{item?.quantity}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{ois.quantity || item?.quantity}
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
