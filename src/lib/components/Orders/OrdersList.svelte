<script lang="ts">
	import { padString } from '$lib/utils';
	import { Modal } from 'flowbite-svelte';
	import OrderOverview from './OrderOverview.svelte';
	export let orders = [];

	let modalVisible = false;
	let activeOrderId = '';

	$: console.log('activeOrderId', activeOrderId);
</script>

<Modal id="ordermodal" bind:open={modalVisible} size="lg" autoclose={true} outsideclose={true}>
	<OrderOverview orderId={activeOrderId} />
</Modal>

<div class="flex-row">
	{#each orders as order}
		{@const orderItemCount = order?.order?.orders_items?.length}
		{@const colour = orderItemCount > 0 ? 'blue' : 'yellow'}

		<div
			on:click={() => {
				activeOrderId = order.order.id;
				modalVisible = true;
			}}
			class:cursor-pointer={true}
			class={`hover:shadow-lg m-1 h-12 w-auto p-4 rounded font-medium inline-flex items-center justify-center bg-${colour}-100 text-${colour}-800 dark:bg-${colour}-900 dark:text-${colour}-300`}
		>
			<div class="overflow-hidden grid grid-cols-2">
				<div>
					<p class="font-bold">{order?.order?.supplier?.name}</p>
				</div>
				<div>
					<p class="float-right">{padString(String(order?.id), 4)}</p>
				</div>
				<div>
					<p>£{order?.order?.orders_items?.reduce((a, v) => a + v.price, 0)}</p>
				</div>
				<div>
					<p class="float-right">{orderItemCount}</p>
				</div>
			</div>
		</div>
	{/each}
</div>
