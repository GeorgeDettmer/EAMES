<script lang="ts">
	import { TableBodyRow, TableBodyCell } from 'flowbite-svelte';

	export let job;
</script>

<TableBodyRow>
	<TableBodyCell />
	<TableBodyCell colspan="3" tdClass="p-0" />
	<TableBodyCell colspan="1" tdClass="p-0" />
	<TableBodyCell tdClass="py-1">
		<!-- <SupplierInfo supplierId={job.supplier.id} /> -->
		{job?.id}
	</TableBodyCell>
	<TableBodyCell colspan="4" tdClass="p-0" />
</TableBodyRow>
<TableBodyRow class="h-24">
	<TableBodyCell colspan="8" tdClass="p-0">
		<div class="">
			<!-- <OrderDetailTable orderIds={[order.id]} hiddenColumns={['supplier']} /> -->
		</div>
	</TableBodyCell>
</TableBodyRow>
