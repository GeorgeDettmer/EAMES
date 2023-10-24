<script lang="ts">
	import { padString } from '$lib/utils';
	import { Modal } from 'flowbite-svelte';
	import OrderOverview from './OrderOverview.svelte';
	import OrdersListItem from './OrdersListItem.svelte';
	export let orders = [];

	let modalVisible = false;
	let activeOrderId = -1;

	$: console.log('activeOrderId', activeOrderId);
</script>

<Modal id="ordermodal" bind:open={modalVisible} size="lg" autoclose={true} outsideclose={true}>
	<OrderOverview orderId={activeOrderId} />
</Modal>

<div class="flex-row">
	{#each orders as { order }}
		<OrdersListItem {order} bind:modalVisible bind:activeOrderId />
	{/each}
</div>
