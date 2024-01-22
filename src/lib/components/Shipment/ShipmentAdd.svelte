<script lang="ts">
	import { padString } from '$lib/utils';
	import { getContextClient, gql, queryStore } from '@urql/svelte';

	let carriersStore = queryStore({
		client: getContextClient(),
		query: gql`
			query carriers {
				erp_carriers(order_by: { name: asc_nulls_last }) {
					id
					name
					image_url
					suppliers {
						id
						name
					}
				}
			}
		`
	});
	$: carriers = $carriersStore?.data?.erp_carriers;

	let shipment = {
		expected_delivery_date: new Date().toISOString(),
		carrier_id: ''
	};
</script>

<div
	class="cursor-pointer h-12 w-auto p-2 rounded font-medium inline-flex items-center justify-center bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
>
	<div class="flex gap-x-4 overflow-hidden">
		<div class="flex-col">
			<p class="font-bold">{shipment?.carrier?.name}</p>
			<div class="flex">
				<!-- TODO: Use different icons, tracking should be 'van', box with tick should be our confirmation of delivery -->
				<!-- <TrackingStatus tracking={shipmentInfo?.tracking} showText={false} showPopover={false} width={20} height={20} /> -->
				<!-- <img
					style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(900%) hue-rotate(70deg)"
					width="20"
					height="20"
					src="https://img.icons8.com/windows/32/delivered-box.png"
					alt="delivered-box"
					class:invisible={!shipmentInfo?.confirmed_delivery_date}
				/> -->
			</div>
		</div>
		<div class="flex-col">
			<div class="justify-end text-right">
				<p>SHP{padString(String(shipment?.id || ''), 4)}</p>
			</div>
			<p class="float-right text-sm">
				{new Date(shipment?.expected_delivery_date).toLocaleDateString('en-GB', {
					day: '2-digit',
					month: '2-digit',
					year: '2-digit'
				})}
			</p>
		</div>
	</div>
	<slot />
</div>
