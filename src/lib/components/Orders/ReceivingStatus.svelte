<script lang="ts">
	import { Popover } from 'flowbite-svelte';
	import TrackingStatus from './TrackingStatus.svelte';
	import { datetimeFormat } from '$lib/utils';
	import UserIcon from '../UserIcon.svelte';

	export let order;
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
	<Popover placement={'left'}>
		{#if order?.received_at}
			<p>
				Recieved
				<em>({datetimeFormat(order?.received_at)})</em>
			</p>
			{#if order?.userByReceivedUserId}
				<UserIcon size="sm" user={order?.userByReceivedUserId}>
					{order?.userByReceivedUserId?.first_name}
					{order?.userByReceivedUserId?.last_name}
				</UserIcon>
			{/if}
		{/if}
	</Popover>
{/if}
