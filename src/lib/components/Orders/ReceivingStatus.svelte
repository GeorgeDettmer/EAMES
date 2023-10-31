<script lang="ts">
	import { Popover, Table, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip } from 'flowbite-svelte';
	import TrackingStatus from './TrackingStatus.svelte';
	import { datetimeFormat } from '$lib/utils';
	import UserIcon from '../UserIcon.svelte';
	import { mediaQuery } from 'svelte-legos';

	export let order = {};
	export let isReceived: boolean = false;

	export let receiveds = [];

	$: recievedQuantity = receiveds?.reduce((a, v) => a + v.quantity, 0);
	$: orderQuantity = order?.quantity;
</script>

{#if isReceived}
	<div class="flex">
		<img
			style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
			width="24"
			height="24"
			src="https://img.icons8.com/windows/32/unpacking.png"
			alt="unpacking"
		/>
		<p class="font-semibold pt-1 pl-2 uppercase text-xs">Received</p>
	</div>
{:else}
	<div class="flex">
		{#if recievedQuantity === orderQuantity || order?.received_at}
			<img
				style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(70deg)"
				width="24"
				height="24"
				src="https://img.icons8.com/windows/32/unpacking.png"
				alt="unpacking"
			/>
			<p class="font-semibold pt-1 pl-2 uppercase text-xs">Received</p>
		{:else if recievedQuantity === 0}
			<img
				style="filter: brightness(0) saturate(10%) invert(30%) sepia(97%) saturate(600%) hue-rotate(350deg)"
				width="24"
				height="24"
				src="https://img.icons8.com/pastel-glyph/64/box--v4.png"
				alt="unpacking"
			/>
			<p class="font-semibold pt-1 pl-2 uppercase text-xs">Not Received</p>
		{:else if recievedQuantity < orderQuantity}
			<img
				style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(600%) hue-rotate(350deg)"
				width="24"
				height="24"
				src="https://img.icons8.com/windows/32/unpacking.png"
				alt="unpacking"
			/>
			<p class="font-semibold pt-1 pl-2 uppercase text-xs">Partially Received</p>
		{/if}
	</div>
	{#if receiveds.length > 0}
		<Popover placement={'left'}>
			<Table>
				<TableHead theadClass="uppercase text-center font-xs">
					<TableHeadCell>User</TableHeadCell>
					<TableHeadCell>Time/Date</TableHeadCell>
					<TableHeadCell>Quantity</TableHeadCell>
				</TableHead>
				{#each receiveds as received}
					<TableBodyRow>
						<TableBodyCell tdClass=" font-xs text-center ">
							<UserIcon size="xs" user={received?.user}>
								{#if mediaQuery('(min-width: 1024px)')}
									{received?.user?.username || 'Unknown'}
								{/if}
							</UserIcon>
							<Tooltip placement="right">
								{#if received?.user?.first_name}
									{received?.user?.first_name}
									{received?.user?.last_name}
								{:else}
									Unknown
								{/if}
							</Tooltip>
						</TableBodyCell>
						<TableBodyCell tdClass=" font-xs text-center">
							{datetimeFormat(received.updated_at)}
						</TableBodyCell>
						<TableBodyCell tdClass=" font-xs text-center">
							{received?.quantity}
						</TableBodyCell>
					</TableBodyRow>
				{:else}
					<TableBodyCell colspan="3">No receipts for this order item</TableBodyCell>
				{/each}
			</Table>
		</Popover>
	{/if}
{/if}
