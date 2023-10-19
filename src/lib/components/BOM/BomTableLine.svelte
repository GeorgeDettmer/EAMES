<script lang="ts">
	import { Badge, TableBodyCell, TableBodyRow } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';

	import BomTableLineReferences from './BomTableLineReferences.svelte';

	export let rowIndex: number = -1;
	export let pn: string | undefined;
	export let description: string = '';
	export let references: string[] = [];
	export let inLibrary: boolean = false;
	export let buildQty: number = 0;
	export let highlighted: boolean = false;
	export let orderItems = [];

	function qtyColor(qty: number, requiredQty: number) {
		if (qty === requiredQty) return 'blue';
		if (qty < requiredQty) return 'red';
		if (qty > requiredQty) return 'green';
	}

	const dispatch = createEventDispatcher();
</script>

<TableBodyRow
	class={`cursor-pointer hover:bg-gray-100 ${highlighted ? 'bg-slate-100' : ''}`}
	on:click={(e) => {
		dispatch('click', e);
	}}
>
	<TableBodyCell>
		{#if rowIndex > -1}
			{rowIndex + 1}
		{/if}
	</TableBodyCell>
	<TableBodyCell class={`${inLibrary ? 'underline' : ''}`}>
		{pn || 'Not Fitted'}
	</TableBodyCell>
	<TableBodyCell tdClass="w-1/4">
		<p class="overflow-hidden text-clip">{description}</p>
	</TableBodyCell>
	<BomTableLineReferences {references} {pn} />
	<TableBodyCell>{references?.length}</TableBodyCell>
	{#if buildQty}
		<TableBodyCell>
			{buildQty}
		</TableBodyCell>
	{/if}
	{#if orderItems.length > 0}
		{@const kitItemQty = orderItems?.reduce((accumulator, currentValue) => accumulator + currentValue.quantity, 0)}
		{@const kitItemAttritionPercentage = ((kitItemQty - buildQty) / buildQty) * 100 || 0}
		<TableBodyCell>
			<Badge class="mx-0.5" color={!pn ? 'blue' : qtyColor(kitItemQty, buildQty)}>
				{kitItemQty}
			</Badge>
		</TableBodyCell>
		<TableBodyCell>
			<Badge class="mx-0.5" color={!pn ? 'blue' : qtyColor(kitItemQty, buildQty)}>
				{kitItemQty - buildQty} ({Math.round(kitItemAttritionPercentage)}%)
			</Badge>
		</TableBodyCell>
	{:else}
		<TableBodyCell />
		<TableBodyCell />
	{/if}
</TableBodyRow>
