<script lang="ts">
	import { classes, datetimeFormat } from '$lib/utils';
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip } from 'flowbite-svelte';
	import { XMark } from 'svelte-heros-v2';
	import UserIcon from '../UserIcon.svelte';
	//import ReceiptItemRemoveButton from './ReceiptItemRemoveButton.svelte';

	export let orderItems = [];
</script>

<Table>
	<TableHead theadClass="text-xs uppercase text-center">
		<TableHeadCell padding="px-1 py-1">Order Item</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">User</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Time/Date</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Qty</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Supplier</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Cost</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Order</TableHeadCell>
		<TableHeadCell padding="px-1 py-1" />
	</TableHead>
	<TableBody>
		{#each orderItems as item, idx}
			<TableBodyRow>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<p class={'uppercase'}>
						{item.id.split('-').slice(-1)}
					</p>
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<UserIcon user={item?.user} size="sm" />
					<Tooltip placement="left">
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
					{datetimeFormat(item.updated_at)}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{item?.quantity}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{item?.order?.supplier?.name || 'Unknown'}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs ">
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: 'GBP'
					}).format(Math.round((item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{#if item?.order?.id}
						<a href={`${window.origin}/order/${item?.order?.id}`} target="_blank" class={classes.link}>
							{item?.order?.id}
						</a>
					{:else}
						N/A
					{/if}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<!-- <KitItemRemoveButton id={item.id}><XMark size="16" /></KitItemRemoveButton> -->
				</TableBodyCell>
			</TableBodyRow>
		{:else}
			<TableBodyRow>
				<TableBodyCell colspan="8" tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">No receipts</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
