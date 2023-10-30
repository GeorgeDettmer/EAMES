<script lang="ts">
	import { padString } from '$lib/utils';

	export let order;
	export let modalVisible: boolean = false;
	export let activeOrderId: number = -1;
	export let color: string = '';
	export let interactive: boolean = true;

	$: orderItemCount = order?.orders_items?.length;
	$: color = color === '' ? (orderItemCount > 0 ? 'blue' : 'yellow') : color;
	let classes = ' hover:shadow-lg m-1 h-12 w-auto p-4 rounded font-medium inline-flex items-center justify-center ';
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if order}
	<div
		on:click={() => {
			if (!interactive) return;
			activeOrderId = order.id;
			modalVisible = true;
		}}
		class:cursor-pointer={interactive}
		class={classes +
			(!order?.id
				? 'bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-300 '
				: orderItemCount > 0
				? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 '
				: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 ')}
	>
		<div class="overflow-hidden grid grid-cols-2 gap-x-2">
			<div>
				<p class="font-bold">{order?.supplier?.name}</p>
			</div>
			<div>
				<p class="float-right">{padString(String(order?.id || ''), 5)}</p>
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
		<slot />
	</div>
{/if}
