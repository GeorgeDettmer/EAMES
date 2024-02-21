<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';

	export let shipments: any[];

	$: confirmed = shipments?.filter((shipment) => shipment?.confirmed_delviery_date).length === shipments.length;
	$: inTransit =
		!confirmed &&
		shipments?.filter((shipment) => shipment?.tracking?.status && shipment?.tracking?.status !== 'DE').length > 0;
	$: delivered = confirmed && !inTransit;

	//$: console.log({ shipments, confirmed, inTransit, delivered });
</script>

<div class="flex">
	{#if confirmed}
		<img
			style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(900%) hue-rotate(70deg)"
			width="24"
			height="24"
			src="https://img.icons8.com/windows/32/delivered-box.png"
			alt="delivered-box"
		/>
		<Tooltip defaultClass="px-2 py-2 text-xs" placement="left">Delivery confirmed</Tooltip>
	{:else if inTransit}
		<img
			style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(800%) hue-rotate(150deg)"
			width="24"
			height="24"
			src="https://img.icons8.com/ios-glyphs/30/delivery--v1.png"
			alt="delivery--v1"
		/>
	{:else if delivered}
		<img
			style="filter: brightness(0) saturate(10%) invert(90%) sepia(97%) saturate(900%) hue-rotate(70deg)"
			width="24"
			height="24"
			src="https://img.icons8.com/ios-glyphs/30/shipped--v1.png"
			alt="delivered-box"
		/>
	{:else}
		<img
			class="dark:opacity-50"
			width="24"
			height="24"
			style="filter: brightness(0) invert(75%)"
			src="https://img.icons8.com/windows/32/box-other.png"
			alt="box-other"
		/>
	{/if}
</div>
