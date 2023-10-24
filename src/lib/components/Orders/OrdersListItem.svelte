<script lang="ts">
	import { padString } from '$lib/utils';

	export let order;
	export let modalVisible: boolean = false;
	export let activeOrderId: number = -1;
	export let color: string = '';

	$: orderItemCount = order?.orders_items?.length;
	$: color = color === '' ? (orderItemCount > 0 ? 'blue' : 'yellow') : color;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	on:click={() => {
		activeOrderId = order.id;
		modalVisible = true;
	}}
	class:cursor-pointer={true}
	class={`hover:shadow-lg m-1 h-12 w-auto p-4 rounded font-medium inline-flex items-center justify-center bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-300`}
>
	<div class="overflow-hidden grid grid-cols-2">
		<div>
			<p class="font-bold">{order?.supplier?.name}</p>
		</div>
		<div>
			<p class="float-right">{padString(String(order?.id), 5)}</p>
		</div>
		<div>
			<p>
				{new Intl.NumberFormat('en-GB', {
					style: 'currency',
					currency: 'GBP'
				}).format(order?.orders_items?.reduce((a, v) => a + v.price * v.quantity, 0))}
			</p>
		</div>
		<div>
			<p class="float-right">{orderItemCount}</p>
		</div>
	</div>
</div>
