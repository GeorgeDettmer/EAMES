<script lang="ts">
	import { classes, datetimeFormat } from '$lib/utils';
	import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip } from 'flowbite-svelte';
	import { XMark } from 'svelte-heros-v2';
	import UserIcon from '../UserIcon.svelte';
	import KitItemRemoveButton from './KitItemRemoveButton.svelte';

	export let kitItems = [];
	export let jobsKits;
</script>

<Table>
	<TableHead theadClass="text-xs uppercase text-center">
		<TableHeadCell padding="px-1 py-1">Kit</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">User</TableHeadCell>
		<!-- <TableHeadCell padding="px-1 py-1">Time/Date</TableHeadCell> -->
		<TableHeadCell padding="px-1 py-1">Qty</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Supplier</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Cost</TableHeadCell>
		<TableHeadCell padding="px-1 py-1">Order</TableHeadCell>
		<TableHeadCell padding="px-1 py-1" />
	</TableHead>
	<TableBody>
		{#each kitItems as item, idx}
			<TableBodyRow>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<a class={'uppercase' + classes.link} target="_blank" href={`${window.origin}/kitting/kits/${item.kit_id}`}>
						{item.kit_id.split('-').slice(-1)}
						{#if jobsKits}
							({jobsKits?.findIndex((jk) => jk.kit.id === item.kit_id) + 1})
						{/if}
					</a>
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<UserIcon user={item?.user} size="xs" />
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
				<!-- <TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{datetimeFormat(item.updated_at)}
				</TableBodyCell> -->
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{item?.quantity}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{item?.orders_item?.order?.supplier?.name || 'Unknown'}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{new Intl.NumberFormat('en-GB', {
						style: 'currency',
						currency: 'GBP'
					}).format(Math.round((item?.orders_item?.price * item?.quantity + Number.EPSILON) * 100) / 100 || 0)}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					{#if item?.orders_item?.order?.id}
						<a href={`${window.origin}/order/${item?.orders_item?.order?.id}`} class={classes.link}>
							{item?.orders_item?.order?.id}
						</a>
					{:else}
						N/A
					{/if}
				</TableBodyCell>
				<TableBodyCell tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					<KitItemRemoveButton id={item.id}><XMark size="16" /></KitItemRemoveButton>
				</TableBodyCell>
			</TableBodyRow>
		{:else}
			<TableBodyRow>
				<TableBodyCell colspan="8" tdClass="px-1 py-1 whitespace-nowrap text-xs text-center">
					No kit assignments
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
